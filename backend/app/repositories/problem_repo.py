import sqlite3
import re
from typing import List, Optional, Dict, Any, Tuple
from app.repositories.tag_repo import TagRepository, slugify
from app.adapters.base import RawProblemItem

class ProblemRepository:
    @staticmethod
    def create_problem(
        conn: sqlite3.Connection,
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

        conn.execute(
            """
            INSERT INTO problems (id, title, slug, difficulty, paid_only, leetcode_url, doocs_url, source)
            VALUES (?, ?, ?, ?, 0, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                title = excluded.title,
                slug = excluded.slug,
                difficulty = excluded.difficulty,
                leetcode_url = coalesce(excluded.leetcode_url, problems.leetcode_url),
                doocs_url = coalesce(excluded.doocs_url, problems.doocs_url)
            """,
            (problem_id, title, slug, difficulty, leetcode_url, doocs_url, source)
        )

        if tags:
            for tag_name in tags:
                tag_id = TagRepository.get_or_create_tag(conn, tag_name, tag_type="topic")
                conn.execute(
                    "INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?)",
                    (problem_id, tag_id)
                )

        if company_tags:
            for comp_name in company_tags:
                tag_id = TagRepository.get_or_create_tag(conn, comp_name, tag_type="company")
                conn.execute(
                    "INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?)",
                    (problem_id, tag_id)
                )

        if notes and user_id:
            conn.execute(
                """
                INSERT INTO user_tracking (user_id, problem_id, status, notes)
                VALUES (?, ?, 'todo', ?)
                ON CONFLICT(user_id, problem_id) DO UPDATE SET notes = excluded.notes
                """,
                (user_id, problem_id, notes)
            )

        return ProblemRepository.get_by_id(conn, problem_id, user_id=user_id)

    @staticmethod
    def get_by_id(conn: sqlite3.Connection, problem_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        query = """
            SELECT 
                p.*,
                COALESCE(ut.status, 'todo') as status,
                COALESCE(ut.is_starred, 0) as is_starred,
                COALESCE(ut.notes, '') as notes,
                ut.updated_at
            FROM problems p
            LEFT JOIN user_tracking ut ON p.id = ut.problem_id AND ut.user_id = ?
            WHERE p.id = ?
        """
        row = conn.execute(query, (user_id, problem_id)).fetchone()
        if not row:
            return None

        prob = dict(row)
        prob["is_starred"] = bool(prob["is_starred"])
        prob["paid_only"] = bool(prob["paid_only"])

        # Fetch tags
        tag_rows = conn.execute("""
            SELECT t.name FROM tags t
            JOIN problem_tags pt ON t.id = pt.tag_id
            WHERE pt.problem_id = ?
            ORDER BY t.name ASC
        """, (problem_id,)).fetchall()
        prob["tags"] = [r["name"] for r in tag_rows]
        return prob

    @staticmethod
    def list_problems(
        conn: sqlite3.Connection,
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
        conditions = []
        params = []

        if tag:
            clean_tag = tag.strip().lower()
            conditions.append("""
                p.id IN (
                    SELECT pt.problem_id FROM problem_tags pt
                    JOIN tags t ON pt.tag_id = t.id
                    WHERE t.slug = ? OR LOWER(t.name) = ?
                )
            """)
            params.extend([clean_tag, clean_tag])

        if difficulty and difficulty.lower() != "all":
            conditions.append("p.difficulty = ?")
            params.append(difficulty.capitalize())

        if status and status.lower() != "all":
            if status.lower() == "todo":
                conditions.append("(ut.status IS NULL OR ut.status = 'todo')")
            else:
                conditions.append("ut.status = ?")
                params.append(status.lower())

        if is_starred is True:
            conditions.append("ut.is_starred = 1")

        if paid_only is not None:
            conditions.append("p.paid_only = ?")
            params.append(1 if paid_only else 0)

        if search:
            clean_search = f"%{search.strip().lower()}%"
            if search_notes:
                conditions.append("(LOWER(p.id) LIKE ? OR LOWER(p.title) LIKE ? OR LOWER(COALESCE(ut.notes, '')) LIKE ?)")
                params.extend([clean_search, clean_search, clean_search])
            else:
                conditions.append("(LOWER(p.id) LIKE ? OR LOWER(p.title) LIKE ?)")
                params.extend([clean_search, clean_search])

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        # Count total
        count_query = f"""
            SELECT COUNT(p.id)
            FROM problems p
            LEFT JOIN user_tracking ut ON p.id = ut.problem_id AND ut.user_id = ?
            {where_clause}
        """
        count_params = [user_id] + params
        total = conn.execute(count_query, count_params).fetchone()[0]

        # Order by logic
        order_map = {
            "id_asc": "CAST(p.id AS INTEGER) ASC, p.id ASC",
            "id_desc": "CAST(p.id AS INTEGER) DESC, p.id DESC",
            "title_asc": "p.title ASC",
            "title_desc": "p.title DESC",
            "difficulty_asc": "CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 ELSE 4 END ASC",
            "difficulty_desc": "CASE p.difficulty WHEN 'Hard' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Easy' THEN 3 ELSE 4 END ASC",
            "frequency_desc": "p.frequency DESC, CAST(p.id AS INTEGER) ASC",
            "frequency_asc": "p.frequency ASC, CAST(p.id AS INTEGER) ASC",
            "status_asc": "CASE COALESCE(ut.status, 'todo') WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'solved' THEN 3 ELSE 4 END ASC, CAST(p.id AS INTEGER) ASC",
            "status_desc": "CASE COALESCE(ut.status, 'todo') WHEN 'solved' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'todo' THEN 3 ELSE 4 END ASC, CAST(p.id AS INTEGER) ASC",
            "recent": "ut.updated_at DESC NULLS LAST, CAST(p.id AS INTEGER) DESC",
        }
        order_by = order_map.get(sort_by, "CAST(p.id AS INTEGER) ASC, p.id ASC")

        offset = (page - 1) * page_size
        data_query = f"""
            SELECT 
                p.*,
                COALESCE(ut.status, 'todo') as status,
                COALESCE(ut.is_starred, 0) as is_starred,
                COALESCE(ut.notes, '') as notes,
                ut.updated_at
            FROM problems p
            LEFT JOIN user_tracking ut ON p.id = ut.problem_id AND ut.user_id = ?
            {where_clause}
            ORDER BY {order_by}
            LIMIT ? OFFSET ?
        """
        data_params = [user_id] + params + [page_size, offset]
        rows = conn.execute(data_query, data_params).fetchall()

        problems = []
        problem_ids = [r["id"] for r in rows]

        # Batch load tags for efficiency
        tag_map: Dict[str, List[str]] = {pid: [] for pid in problem_ids}
        if problem_ids:
            placeholders = ",".join(["?"] * len(problem_ids))
            tag_query = f"""
                SELECT pt.problem_id, t.name
                FROM problem_tags pt
                JOIN tags t ON pt.tag_id = t.id
                WHERE pt.problem_id IN ({placeholders})
                ORDER BY CASE WHEN t.type = 'topic' THEN 0 ELSE 1 END, t.name ASC
            """
            for trow in conn.execute(tag_query, problem_ids).fetchall():
                tag_map[trow["problem_id"]].append(trow["name"])

        for r in rows:
            prob = dict(r)
            prob["is_starred"] = bool(prob["is_starred"])
            prob["paid_only"] = bool(prob["paid_only"])
            prob["tags"] = tag_map.get(prob["id"], [])
            problems.append(prob)

        return problems, total

    @staticmethod
    def batch_upsert_enriched_problems(
        items: List[RawProblemItem],
        conn: Optional[sqlite3.Connection] = None,
        source: str = "default",
    ) -> Dict[str, int]:
        """Idempotently merge adapter items into the DB.

        Frequency is stored per (problem, source) and summed, so re-running the
        same source replaces its contribution instead of adding to it. Only the
        authoritative catalog source may overwrite title/difficulty. Items whose
        slug is unknown and that carry no official ID are skipped rather than
        given a made-up ID. Does not commit; the caller owns the transaction.
        """
        from app.db.session import get_db_connection

        if conn is None:
            with get_db_connection() as c:
                return ProblemRepository.batch_upsert_enriched_problems(items, conn=c, source=source)

        authoritative = source == AUTHORITATIVE_SOURCE
        cursor = conn.cursor()
        upserted_count = 0
        tags_linked = 0
        skipped = 0

        for item in items:
            difficulty = _normalize_difficulty(item.difficulty)
            cursor.execute("SELECT id, difficulty FROM problems WHERE slug = ?", (item.slug,))
            row = cursor.fetchone()

            if row:
                prob_id = row[0]
                cursor.execute(
                    """
                    UPDATE problems
                    SET title = CASE WHEN ? AND ? IS NOT NULL AND ? != '' THEN ? ELSE title END,
                        difficulty = CASE
                            WHEN ? IS NOT NULL AND (? OR difficulty = 'Unknown') THEN ?
                            ELSE difficulty END,
                        paid_only = MAX(paid_only, ?),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                    """,
                    (
                        authoritative, item.title, item.title, item.title,
                        difficulty, authoritative, difficulty,
                        1 if item.paid_only else 0,
                        prob_id,
                    ),
                )
            else:
                prob_id = (item.leetcode_id or "").strip()
                if not prob_id:
                    skipped += 1
                    continue
                if cursor.execute("SELECT 1 FROM problems WHERE id = ?", (prob_id,)).fetchone():
                    # ID already belongs to a different slug; never overwrite it.
                    skipped += 1
                    continue
                cursor.execute(
                    """
                    INSERT INTO problems (id, title, slug, difficulty, paid_only, leetcode_url, source)
                    VALUES (?, ?, ?, ?, ?, ?, 'sync')
                    """,
                    (
                        prob_id,
                        item.title or item.slug.replace("-", " ").title(),
                        item.slug,
                        difficulty or "Unknown",
                        1 if item.paid_only else 0,
                        f"https://leetcode.com/problems/{item.slug}/",
                    ),
                )

            cursor.execute(
                """
                INSERT INTO problem_source_freq (problem_id, source, frequency)
                VALUES (?, ?, ?)
                ON CONFLICT(problem_id, source) DO UPDATE SET frequency = excluded.frequency
                """,
                (prob_id, source, item.frequency_delta),
            )
            cursor.execute(
                """
                UPDATE problems
                SET frequency = (SELECT COALESCE(SUM(frequency), 0) FROM problem_source_freq WHERE problem_id = ?)
                WHERE id = ?
                """,
                (prob_id, prob_id),
            )
            upserted_count += 1

            tag_mappings = (
                [(t, "topic") for t in item.topics]
                + [(c, "company") for c in item.companies]
                + [(l, "list") for l in item.curated_lists]
            )
            for tag_name, tag_type in tag_mappings:
                if not tag_name or not tag_name.strip():
                    continue
                tag_id = _get_or_create_typed_tag(cursor, tag_name.strip(), tag_type)
                cursor.execute(
                    "INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?)",
                    (prob_id, tag_id),
                )
                tags_linked += 1

        return {"upserted_problems": upserted_count, "tags_linked": tags_linked, "skipped_unknown_id": skipped}


AUTHORITATIVE_SOURCE = "leetcode_catalog"
_VALID_DIFFICULTIES = {"easy": "Easy", "medium": "Medium", "hard": "Hard"}


def _normalize_difficulty(value: Optional[str]) -> Optional[str]:
    return _VALID_DIFFICULTIES.get((value or "").strip().lower())


def _get_or_create_typed_tag(cursor: sqlite3.Cursor, name: str, tag_type: str) -> int:
    """Find/create a tag of the given type, matching existing tags by slug or name.

    Slugs (and, in older databases, names) are globally unique, so a name that
    collides with a tag of another type gets a type-prefixed slug and, if needed,
    a "(type)" name suffix instead of being merged into that tag."""
    base_slug = slugify(name)
    rows = cursor.execute(
        "SELECT id, type, slug, name FROM tags WHERE slug = ? OR LOWER(name) = LOWER(?)",
        (base_slug, name),
    ).fetchall()
    for r in rows:
        if r[1] == tag_type:
            return r[0]

    slug = base_slug
    if any(r[2] == slug for r in rows):
        slug = f"{tag_type}-{base_slug}"
    tag_name = name
    if any(r[3].lower() == name.lower() for r in rows):
        tag_name = f"{name} ({tag_type})"
    cursor.execute("INSERT INTO tags (name, slug, type) VALUES (?, ?, ?)", (tag_name, slug, tag_type))
    return cursor.lastrowid
