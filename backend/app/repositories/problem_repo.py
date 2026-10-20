from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import BigInteger, case, cast, func, literal, select, text, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.adapters.base import RawProblemItem
from app.db.models import Problem, ProblemSourceFreq, ProblemTag, Tag, UserTracking
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

        stmt = pg_insert(Problem).values(
            id=problem_id, title=title, slug=slug, difficulty=difficulty,
            paid_only=0, leetcode_url=leetcode_url, doocs_url=doocs_url, source=source,
        ).on_conflict_do_update(
            index_elements=["id"],
            set_=dict(
                title=text("EXCLUDED.title"),
                slug=text("EXCLUDED.slug"),
                difficulty=text("EXCLUDED.difficulty"),
                leetcode_url=func.coalesce(text("EXCLUDED.leetcode_url"), Problem.leetcode_url),
                doocs_url=func.coalesce(text("EXCLUDED.doocs_url"), Problem.doocs_url),
            ),
        )
        db.execute(stmt)

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

    @staticmethod
    def batch_upsert_enriched_problems(
        items: List[RawProblemItem],
        conn: Optional[Any] = None,
        source: str = "default",
        *,
        db: Optional[Any] = None,
    ) -> Dict[str, int]:
        from app.db.session import get_db

        session: Session = db if db is not None else conn
        if session is None:
            with get_db() as s:
                return ProblemRepository.batch_upsert_enriched_problems(
                    items, db=s, source=source
                )

        authoritative = source == AUTHORITATIVE_SOURCE
        upserted_count = 0
        tags_linked = 0
        skipped = 0

        for item in items:
            difficulty = _normalize_difficulty(item.difficulty)

            existing = session.execute(
                select(Problem.id, Problem.difficulty).where(Problem.slug == item.slug)
            ).first()

            if existing:
                prob_id = existing[0]
                paid_val = 1 if item.paid_only else 0
                updates = {"updated_at": func.now()}
                if authoritative and item.title:
                    updates["title"] = item.title
                if difficulty and (authoritative or existing[1] == "Unknown"):
                    updates["difficulty"] = difficulty
                updates["paid_only"] = case(
                    (literal(paid_val) > Problem.paid_only, paid_val),
                    else_=Problem.paid_only,
                )
                session.execute(update(Problem).where(Problem.id == prob_id).values(**updates))
            else:
                prob_id = (item.leetcode_id or "").strip()
                if not prob_id:
                    skipped += 1
                    continue
                id_exists = session.execute(
                    select(Problem.id).where(Problem.id == prob_id)
                ).first()
                if id_exists:
                    skipped += 1
                    continue
                session.add(Problem(
                    id=prob_id,
                    title=item.title or item.slug.replace("-", " ").title(),
                    slug=item.slug,
                    difficulty=difficulty or "Unknown",
                    paid_only=1 if item.paid_only else 0,
                    leetcode_url=f"https://leetcode.com/problems/{item.slug}/",
                    source="sync",
                ))
                session.flush()

            # Upsert source frequency
            session.execute(
                pg_insert(ProblemSourceFreq).values(
                    problem_id=prob_id, source=source, frequency=item.frequency_delta,
                ).on_conflict_do_update(
                    index_elements=["problem_id", "source"],
                    set_=dict(frequency=text("EXCLUDED.frequency")),
                )
            )
            # Update aggregate frequency
            freq_sum = select(func.coalesce(func.sum(ProblemSourceFreq.frequency), 0)).where(
                ProblemSourceFreq.problem_id == prob_id
            ).scalar_subquery()
            session.execute(update(Problem).where(Problem.id == prob_id).values(frequency=freq_sum))
            upserted_count += 1

            # Link tags
            tag_mappings = (
                [(t, "topic") for t in item.topics]
                + [(c, "company") for c in item.companies]
                + [(l, "list") for l in item.curated_lists]
            )
            for tag_name, tag_type in tag_mappings:
                if not tag_name or not tag_name.strip():
                    continue
                tag_id = _get_or_create_typed_tag(session, tag_name.strip(), tag_type)
                session.execute(
                    pg_insert(ProblemTag).values(problem_id=prob_id, tag_id=tag_id)
                    .on_conflict_do_nothing()
                )
                tags_linked += 1

        return {
            "upserted_problems": upserted_count,
            "tags_linked": tags_linked,
            "skipped_unknown_id": skipped,
        }


AUTHORITATIVE_SOURCE = "leetcode_catalog"
_VALID_DIFFICULTIES = {"easy": "Easy", "medium": "Medium", "hard": "Hard"}


def _normalize_difficulty(value: Optional[str]) -> Optional[str]:
    return _VALID_DIFFICULTIES.get((value or "").strip().lower())


def _get_or_create_typed_tag(db: Session, name: str, tag_type: str) -> int:
    base_slug = slugify(name)
    rows = db.execute(
        select(Tag.id, Tag.type, Tag.slug, Tag.name)
        .where((Tag.slug == base_slug) | (func.lower(Tag.name) == name.lower()))
    ).all()

    for r in rows:
        if r[1] == tag_type:
            return r[0]

    slug = base_slug
    if any(r[2] == slug for r in rows):
        slug = f"{tag_type}-{base_slug}"
    tag_name = name
    if any(r[3].lower() == name.lower() for r in rows):
        tag_name = f"{name} ({tag_type})"

    new_tag = Tag(name=tag_name, slug=slug, type=tag_type)
    db.add(new_tag)
    db.flush()
    return new_tag.id
