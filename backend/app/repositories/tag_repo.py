import re
from typing import Any, Dict, List, Optional

from sqlalchemy import case, func, literal, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.orm import Session

from app.db.models import ProblemTag, Tag, UserTracking


def slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower())
    return slug.strip("-")


class TagRepository:
    @staticmethod
    def get_or_create_tag(db: Session, name: str, tag_type: str = "topic") -> int:
        clean_name = name.strip()
        slug = slugify(clean_name)
        row = db.execute(
            select(Tag.id).where((Tag.name == clean_name) | (Tag.slug == slug))
        ).scalar_one_or_none()
        if row:
            return row

        stmt = pg_insert(Tag).values(
            name=clean_name, slug=slug, type=tag_type
        ).on_conflict_do_update(
            index_elements=["slug"],
            set_=dict(name=text("EXCLUDED.name"), type=text("EXCLUDED.type")),
        ).returning(Tag.id)
        tag_id = db.execute(stmt).scalar_one()
        return tag_id

    @staticmethod
    def list_tags(
        db: Session,
        user_id: Optional[str] = None,
        tag_type: Optional[str] = None,
        status: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        t = Tag.__table__
        pt = ProblemTag.__table__

        join = t.outerjoin(pt, t.c.id == pt.c.tag_id)
        conditions = []

        if tag_type:
            conditions.append(t.c.type == tag_type)

        if status and status in ("todo", "in_progress", "solved"):
            ut = UserTracking.__table__
            join = join.outerjoin(ut, (pt.c.problem_id == ut.c.problem_id) & (ut.c.user_id == user_id))
            if status == "todo":
                count_expr = func.count(case(((ut.c.status.is_(None)) | (ut.c.status == "todo"), 1)))
            else:
                count_expr = func.count(case((ut.c.status == status, 1)))
        else:
            count_expr = func.count(pt.c.problem_id)

        stmt = (
            select(
                t.c.id,
                t.c.name,
                t.c.slug,
                func.coalesce(t.c.type, "topic").label("type"),
                count_expr.label("problem_count"),
            )
            .select_from(join)
            .group_by(t.c.id)
            .order_by(
                case(
                    (t.c.type == "company", 10),
                    (t.c.slug == "k-shortest-paths", 1),
                    (t.c.slug == "shortest-path", 2),
                    (t.c.slug == "dijkstra", 3),
                    (t.c.slug == "0-1-bfs", 4),
                    (t.c.slug == "bellmanford", 5),
                    (t.c.slug == "floydwarshall", 6),
                    (t.c.slug == "graph", 7),
                    else_=8,
                ),
                text("problem_count DESC"),
                t.c.name.asc(),
            )
        )
        if conditions:
            stmt = stmt.where(*conditions)

        rows = db.execute(stmt).mappings().all()
        return [dict(r) for r in rows]
