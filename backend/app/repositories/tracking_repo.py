from typing import Any, Dict, Optional

from sqlalchemy import case, func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.db.models import Problem, ProblemTag, Tag, UserTracking


class TrackingRepository:
    @staticmethod
    def upsert_tracking(
        db: Session,
        user_id: str,
        problem_id: str,
        status: Optional[str] = None,
        is_starred: Optional[bool] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        existing = db.execute(
            select(UserTracking).where(
                UserTracking.user_id == user_id,
                UserTracking.problem_id == problem_id,
            )
        ).scalar_one_or_none()

        curr_status = existing.status if existing else "todo"
        curr_starred = bool(existing.is_starred) if existing else False
        curr_notes = existing.notes if existing else ""

        new_status = status if status is not None else curr_status
        new_starred = int(is_starred) if is_starred is not None else int(curr_starred)
        new_notes = notes if notes is not None else curr_notes

        stmt = pg_insert(UserTracking).values(
            user_id=user_id,
            problem_id=problem_id,
            status=new_status,
            is_starred=new_starred,
            notes=new_notes,
        ).on_conflict_do_update(
            index_elements=["user_id", "problem_id"],
            set_=dict(
                status=text("EXCLUDED.status"),
                is_starred=text("EXCLUDED.is_starred"),
                notes=text("EXCLUDED.notes"),
                updated_at=func.now(),
            ),
        )
        db.execute(stmt)
        db.flush()

        row = db.execute(
            select(UserTracking).where(
                UserTracking.user_id == user_id,
                UserTracking.problem_id == problem_id,
            )
        ).scalar_one()
        return {
            "user_id": row.user_id,
            "problem_id": row.problem_id,
            "status": row.status,
            "is_starred": row.is_starred,
            "notes": row.notes,
            "updated_at": row.updated_at,
        }

    @staticmethod
    def get_stats(
        db: Session,
        user_id: str,
        tag_slug: Optional[str] = None,
    ) -> Dict[str, Any]:
        p = Problem.__table__
        ut = UserTracking.__table__.alias("ut")
        join = p.outerjoin(ut, (p.c.id == ut.c.problem_id) & (ut.c.user_id == user_id))

        overall = db.execute(
            select(
                func.count(p.c.id).label("total_problems"),
                func.count(case((ut.c.status == "solved", 1))).label("solved_problems"),
                func.count(case((ut.c.status == "in_progress", 1))).label("in_progress_problems"),
                func.count(case(((ut.c.status.is_(None)) | (ut.c.status == "todo"), 1))).label("todo_problems"),
                func.count(case((ut.c.is_starred == 1, 1))).label("starred_problems"),
                func.count(case((p.c.difficulty == "Easy", 1))).label("easy_total"),
                func.count(case(((p.c.difficulty == "Easy") & (ut.c.status == "solved"), 1))).label("easy_solved"),
                func.count(case((p.c.difficulty == "Medium", 1))).label("medium_total"),
                func.count(case(((p.c.difficulty == "Medium") & (ut.c.status == "solved"), 1))).label("medium_solved"),
                func.count(case((p.c.difficulty == "Hard", 1))).label("hard_total"),
                func.count(case(((p.c.difficulty == "Hard") & (ut.c.status == "solved"), 1))).label("hard_solved"),
            ).select_from(join)
        ).mappings().first()

        stats = dict(overall) if overall else {}
        total = stats.get("total_problems", 0)
        solved = stats.get("solved_problems", 0)
        stats["completion_percentage"] = round((solved / total * 100), 1) if total > 0 else 0.0

        if tag_slug:
            tag_row = db.execute(
                select(
                    Tag.name.label("tag_name"),
                    func.count(Problem.id).label("tag_total"),
                    func.count(case((ut.c.status == "solved", 1))).label("tag_solved"),
                )
                .select_from(
                    Tag.__table__
                    .join(ProblemTag.__table__, Tag.id == ProblemTag.tag_id)
                    .join(Problem.__table__, ProblemTag.problem_id == Problem.id)
                    .outerjoin(ut, (Problem.id == ut.c.problem_id) & (ut.c.user_id == user_id))
                )
                .where(Tag.slug == tag_slug)
                .group_by(Tag.id)
            ).mappings().first()
            if tag_row:
                stats["tag_name"] = tag_row["tag_name"]
                stats["tag_total"] = tag_row["tag_total"]
                stats["tag_solved"] = tag_row["tag_solved"]

        return stats
