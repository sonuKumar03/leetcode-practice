from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import BigInteger, case, cast, func, literal, select, text, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.db.models import Problem, ProblemTag, Tag, UserTracking
from app.repositories.tag_repo import TagRepository, slugify


class ProblemRepository:
    @staticmethod
    def create_problem(
        db: Session,
        problem_id: str,
        title: str,
        difficulty: str = "Medium",
        tags: Optional[List[str]] = None,
        company_tags: Optional[List[str]] = None,
        leetcode_url: Optional[str] = None,
        doocs_url: Optional[str] = None,
        notes: Optional[str] = None,
        source: str = "custom",
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        slug = slugify(title)
        if not leetcode_url:
            leetcode_url = f"https://leetcode.com/problems/{slug}/"
        if not doocs_url and problem_id.isdigit():
            doocs_url = f"https://leetcode.doocs.org/en/lc/{problem_id}/"

        existing = db.execute(
            select(Problem.id).where((Problem.id == problem_id) | (Problem.slug == slug))
        ).first()
        if existing:
            raise ValueError(f"Problem '{problem_id}' already exists")

        db.add(Problem(
            id=problem_id, title=title, slug=slug, difficulty=difficulty,
            paid_only=0, leetcode_url=leetcode_url, doocs_url=doocs_url, source=source,
        ))
        db.flush()

        if tags:
            for tag_name in tags:
                tag_id = TagRepository.get_or_create_tag(db, tag_name, tag_type="topic")
                db.execute(
                    pg_insert(ProblemTag).values(problem_id=problem_id, tag_id=tag_id)
                    .on_conflict_do_nothing()
                )

        if company_tags:
            for comp_name in company_tags:
                tag_id = TagRepository.get_or_create_tag(db, comp_name, tag_type="company")
                db.execute(
                    pg_insert(ProblemTag).values(problem_id=problem_id, tag_id=tag_id)
                    .on_conflict_do_nothing()
                )

        if notes and user_id:
            db.execute(
                pg_insert(UserTracking).values(
                    user_id=user_id, problem_id=problem_id, status="todo", notes=notes,
                ).on_conflict_do_update(
                    index_elements=["user_id", "problem_id"],
                    set_=dict(notes=text("EXCLUDED.notes")),
                )
            )

        return ProblemRepository.get_by_id(db, problem_id, user_id=user_id) or {}

    @staticmethod
    def get_by_id(
        db: Session,
        problem_id: str,
        user_id: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        ut = UserTracking.__table__.alias("ut")
        p = Problem.__table__

        stmt = (
            select(
                p.c.id, p.c.title, p.c.slug, p.c.difficulty, p.c.paid_only,
                p.c.leetcode_url, p.c.doocs_url, p.c.source, p.c.frequency,
                p.c.created_at, p.c.updated_at,
                func.coalesce(ut.c.status, "todo").label("status"),
                func.coalesce(ut.c.is_starred, 0).label("is_starred"),
                func.coalesce(ut.c.notes, "").label("notes"),
                ut.c.updated_at.label("tracking_updated_at"),
            )
            .select_from(
                p.outerjoin(ut, (p.c.id == ut.c.problem_id) & (ut.c.user_id == user_id))
            )
            .where(p.c.id == problem_id)
        )
        row = db.execute(stmt).mappings().first()
        if not row:
            return None

        prob = dict(row)
        prob["is_starred"] = bool(prob["is_starred"])
        prob["paid_only"] = bool(prob["paid_only"])
        prob["updated_at"] = prob.pop("tracking_updated_at") or prob["updated_at"]

        tag_rows = db.execute(
            select(Tag.name)
            .join(ProblemTag, Tag.id == ProblemTag.tag_id)
            .where(ProblemTag.problem_id == problem_id)
            .order_by(Tag.name.asc())
        ).scalars().all()
        prob["tags"] = list(tag_rows)
        return prob

    @staticmethod
    def list_problems(
        db: Session,
        user_id: Optional[str] = None,
        tag: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        is_starred: Optional[bool] = None,
        paid_only: Optional[bool] = None,
        search_notes: bool = False,
        page: int = 1,
        page_size: int = 50,
        sort_by: str = "id_asc",
    ) -> Tuple[List[Dict[str, Any]], int]:
        ut = UserTracking.__table__.alias("ut")
        p = Problem.__table__

        join = p.outerjoin(ut, (p.c.id == ut.c.problem_id) & (ut.c.user_id == user_id))
        conditions = []

        if tag:
            clean_tag = tag.strip().lower()
            tag_sub = (
                select(ProblemTag.problem_id)
                .join(Tag, ProblemTag.tag_id == Tag.id)
                .where((Tag.slug == clean_tag) | (func.lower(Tag.name) == clean_tag))
            ).scalar_subquery()
            conditions.append(p.c.id.in_(tag_sub))

        if difficulty and difficulty.lower() != "all":
            conditions.append(p.c.difficulty == difficulty.capitalize())

        if status and status.lower() != "all":
            if status.lower() == "todo":
                conditions.append((ut.c.status.is_(None)) | (ut.c.status == "todo"))
            else:
                conditions.append(ut.c.status == status.lower())

        if is_starred is True:
            conditions.append(ut.c.is_starred == 1)

        if paid_only is not None:
            conditions.append(p.c.paid_only == (1 if paid_only else 0))

        if search:
            clean_search = f"%{search.strip().lower()}%"
            if search_notes:
                conditions.append(
                    func.lower(p.c.id).like(clean_search)
                    | func.lower(p.c.title).like(clean_search)
                    | func.lower(func.coalesce(ut.c.notes, "")).like(clean_search)
                )
            else:
                conditions.append(
                    func.lower(p.c.id).like(clean_search)
                    | func.lower(p.c.title).like(clean_search)
                )

        where = conditions[0] if len(conditions) == 1 else (conditions[0] if conditions else None)
        if len(conditions) > 1:
            from sqlalchemy import and_
            where = and_(*conditions)

        # Count
        count_stmt = select(func.count(p.c.id)).select_from(join)
        if where is not None:
            count_stmt = count_stmt.where(where)
        total = db.execute(count_stmt).scalar() or 0

        # Sort expressions
        num_id = case(
            (p.c.id.regexp_match(r"^[0-9]{1,18}$"), cast(p.c.id, BigInteger)),
            else_=literal(0),
        )
        coalesced_status = func.coalesce(ut.c.status, "todo")

        order_map = {
            "id_asc": [num_id.asc(), p.c.id.asc()],
            "id_desc": [num_id.desc(), p.c.id.desc()],
            "title_asc": [p.c.title.asc()],
            "title_desc": [p.c.title.desc()],
            "difficulty_asc": [case(
                (p.c.difficulty == "Easy", 1), (p.c.difficulty == "Medium", 2),
                (p.c.difficulty == "Hard", 3), else_=4,
            ).asc()],
            "difficulty_desc": [case(
                (p.c.difficulty == "Hard", 1), (p.c.difficulty == "Medium", 2),
                (p.c.difficulty == "Easy", 3), else_=4,
            ).asc()],
            "frequency_desc": [p.c.frequency.desc(), num_id.asc()],
            "frequency_asc": [p.c.frequency.asc(), num_id.asc()],
            "status_asc": [case(
                (coalesced_status == "todo", 1), (coalesced_status == "in_progress", 2),
                (coalesced_status == "solved", 3), else_=4,
            ).asc(), num_id.asc()],
            "status_desc": [case(
                (coalesced_status == "solved", 1), (coalesced_status == "in_progress", 2),
                (coalesced_status == "todo", 3), else_=4,
            ).asc(), num_id.asc()],
            "recent": [ut.c.updated_at.desc().nulls_last(), num_id.desc()],
        }
        order_clauses = order_map.get(sort_by, [num_id.asc(), p.c.id.asc()])

        offset = (page - 1) * page_size
        data_stmt = (
            select(
                p.c.id, p.c.title, p.c.slug, p.c.difficulty, p.c.paid_only,
                p.c.leetcode_url, p.c.doocs_url, p.c.source, p.c.frequency,
                p.c.created_at, p.c.updated_at,
                func.coalesce(ut.c.status, "todo").label("status"),
                func.coalesce(ut.c.is_starred, 0).label("is_starred"),
                func.coalesce(ut.c.notes, "").label("notes"),
                ut.c.updated_at.label("tracking_updated_at"),
            )
            .select_from(join)
            .order_by(*order_clauses)
            .limit(page_size)
            .offset(offset)
        )
        if where is not None:
            data_stmt = data_stmt.where(where)

        rows = db.execute(data_stmt).mappings().all()
        problem_ids = [r["id"] for r in rows]

        # Batch load tags
        tag_map: Dict[str, List[str]] = {pid: [] for pid in problem_ids}
        if problem_ids:
            tag_rows = db.execute(
                select(ProblemTag.problem_id, Tag.name)
                .join(Tag, ProblemTag.tag_id == Tag.id)
                .where(ProblemTag.problem_id.in_(problem_ids))
                .order_by(
                    case((Tag.type == "topic", 0), else_=1),
                    Tag.name.asc(),
                )
            ).mappings().all()
            for trow in tag_rows:
                tag_map[trow["problem_id"]].append(trow["name"])

        problems = []
        for r in rows:
            prob = dict(r)
            prob["is_starred"] = bool(prob["is_starred"])
            prob["paid_only"] = bool(prob["paid_only"])
            prob["updated_at"] = prob.pop("tracking_updated_at") or prob["updated_at"]
            prob["tags"] = tag_map.get(prob["id"], [])
            problems.append(prob)

        return problems, total

