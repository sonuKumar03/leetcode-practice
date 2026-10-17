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

        if notes:
            conn.execute(
                """
                INSERT INTO user_tracking (problem_id, status, notes)
                VALUES (?, 'todo', ?)
                ON CONFLICT(problem_id) DO UPDATE SET notes = excluded.notes
                """,
                (problem_id, notes)
            )

        return ProblemRepository.get_by_id(conn, problem_id)

    @staticmethod
    def get_by_id(conn: sqlite3.Connection, problem_id: str) -> Optional[Dict[str, Any]]:
        query = """
            SELECT 
                p.*,
                COALESCE(ut.status, 'todo') as status,
                COALESCE(ut.is_starred, 0) as is_starred,
                COALESCE(ut.notes, '') as notes,
                ut.updated_at
            FROM problems p
            LEFT JOIN user_tracking ut ON p.id = ut.problem_id
            WHERE p.id = ?
        """
        row = conn.execute(query, (problem_id,)).fetchone()
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
        tag: Optional[str] = None,
        difficulty: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        is_starred: Optional[bool] = None,
        paid_only: Optional[bool] = None,
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
            conditions.append("(LOWER(p.id) LIKE ? OR LOWER(p.title) LIKE ?)")
            params.extend([clean_search, clean_search])

        where_clause = "WHERE " + " AND ".join(conditions) if conditions else ""

        # Count total
        count_query = f"""
            SELECT COUNT(p.id)
            FROM problems p
            LEFT JOIN user_tracking ut ON p.id = ut.problem_id
            {where_clause}
        """
        total = conn.execute(count_query, params).fetchone()[0]

        # Order by logic
        order_map = {
            "id_asc": "CAST(p.id AS INTEGER) ASC, p.id ASC",
            "id_desc": "CAST(p.id AS INTEGER) DESC, p.id DESC",
            "title_asc": "p.title ASC",
            "title_desc": "p.title DESC",
            "difficulty_asc": "CASE p.difficulty WHEN 'Easy' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Hard' THEN 3 ELSE 4 END ASC",
            "difficulty_desc": "CASE p.difficulty WHEN 'Hard' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Easy' THEN 3 ELSE 4 END ASC",
            "status_asc": "COALESCE(ut.status, 'todo') ASC",
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
            LEFT JOIN user_tracking ut ON p.id = ut.problem_id
            {where_clause}
            ORDER BY {order_by}
            LIMIT ? OFFSET ?
        """
        data_params = params + [page_size, offset]
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
    def batch_upsert_enriched_problems(items: List[RawProblemItem], conn: Optional[sqlite3.Connection] = None) -> Dict[str, int]:
        from app.repositories.tag_repo import slugify
        from app.db.session import get_db_connection

        if conn is None:
            with get_db_connection() as c:
                return ProblemRepository.batch_upsert_enriched_problems(items, conn=c)

        cursor = conn.cursor()
        upserted_count = 0
        tags_linked = 0

        for item in items:
            # 1. Check if problem exists by slug or id
            cursor.execute("SELECT id, frequency FROM problems WHERE slug = ?", (item.slug,))
            row = cursor.fetchone()
            prob_id = item.leetcode_id

            if row:
                prob_id = row["id"] if hasattr(row, "keys") else row[0]
                freq = row["frequency"] if hasattr(row, "keys") else row[1]
                new_freq = (freq or 0) + item.frequency_delta
                cursor.execute("""
                    UPDATE problems
                    SET title = COALESCE(?, title),
                        difficulty = COALESCE(?, difficulty),
                        frequency = ?
                    WHERE slug = ?
                """, (item.title, item.difficulty, new_freq, item.slug))
            else:
                if not prob_id:
                    cursor.execute("SELECT MAX(CAST(id AS INTEGER)) as max_id FROM problems")
                    max_row = cursor.fetchone()
                    max_id = (max_row["max_id"] if hasattr(max_row, "keys") else max_row[0]) if max_row else None
                    next_id = (max_id or 10000) + 1
                    prob_id = str(next_id)

                lc_url = f"https://leetcode.com/problems/{item.slug}/"
                cursor.execute("""
                    INSERT INTO problems (id, title, slug, difficulty, paid_only, leetcode_url, frequency)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    prob_id,
                    item.title or item.slug.replace("-", " ").title(),
                    item.slug,
                    item.difficulty or "Medium",
                    1 if item.paid_only else 0,
                    lc_url,
                    item.frequency_delta
                ))
            upserted_count += 1

            # 2. Upsert and link tags: topics, companies, curated_lists
            tag_mappings = (
                [(t, "topic") for t in item.topics] +
                [(c, "company") for c in item.companies] +
                [(l, "list") for l in item.curated_lists]
            )

            for tag_name, tag_type in tag_mappings:
                if not tag_name or not tag_name.strip():
                    continue
                tag_name = tag_name.strip()
                tag_slug = slugify(tag_name)

                cursor.execute("SELECT id FROM tags WHERE slug = ? AND type = ?", (tag_slug, tag_type))
                tag_row = cursor.fetchone()
                if not tag_row:
                    cursor.execute("SELECT id FROM tags WHERE slug = ?", (tag_slug,))
                    tag_row = cursor.fetchone()

                if tag_row:
                    tag_id = tag_row["id"] if hasattr(tag_row, "keys") else tag_row[0]
                else:
                    cursor.execute(
                        "INSERT INTO tags (name, slug, type) VALUES (?, ?, ?)",
                        (tag_name, tag_slug, tag_type)
                    )
                    tag_id = cursor.lastrowid

                cursor.execute(
                    "INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?)",
                    (prob_id, tag_id)
                )
                tags_linked += 1

        conn.commit()
        return {"upserted_problems": upserted_count, "tags_linked": tags_linked}

