import re
import sqlite3
from typing import List, Dict, Any, Optional

def slugify(text: str) -> str:
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", text.strip().lower())
    return slug.strip("-")

class TagRepository:
    @staticmethod
    def get_or_create_tag(conn: sqlite3.Connection, name: str, tag_type: str = "topic") -> int:
        clean_name = name.strip()
        slug = slugify(clean_name)
        row = conn.execute("SELECT id FROM tags WHERE name = ? OR slug = ?", (clean_name, slug)).fetchone()
        if row:
            return row["id"]
        cursor = conn.execute(
            "INSERT INTO tags (name, slug, type) VALUES (?, ?, ?) ON CONFLICT(slug) DO UPDATE SET name=excluded.name, type=excluded.type RETURNING id",
            (clean_name, slug, tag_type)
        )
        tag_id = cursor.fetchone()[0]
        return tag_id

    @staticmethod
    def list_tags(conn: sqlite3.Connection, tag_type: Optional[str] = None, status: Optional[str] = None) -> List[Dict[str, Any]]:
        where_clauses = []
        params = []
        if tag_type:
            where_clauses.append("t.type = ?")
            params.append(tag_type)

        joins = "LEFT JOIN problem_tags pt ON t.id = pt.tag_id"
        count_expr = "COUNT(pt.problem_id)"

        if status and status in ('todo', 'in_progress', 'solved'):
            joins += " LEFT JOIN user_tracking ut ON pt.problem_id = ut.problem_id"
            if status == 'todo':
                count_expr = "COUNT(CASE WHEN ut.status IS NULL OR ut.status = 'todo' THEN 1 END)"
            else:
                count_expr = f"COUNT(CASE WHEN ut.status = ? THEN 1 END)"
                params.append(status)

        where_clause = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

        query = f"""
            SELECT t.id, t.name, t.slug, COALESCE(t.type, 'topic') as type, {count_expr} as problem_count
            FROM tags t
            {joins}
            {where_clause}
            GROUP BY t.id
            ORDER BY 
                CASE 
                    WHEN t.type = 'company' THEN 10
                    WHEN t.slug = 'k-shortest-paths' THEN 1
                    WHEN t.slug = 'shortest-path' THEN 2
                    WHEN t.slug = 'dijkstra' THEN 3
                    WHEN t.slug = '0-1-bfs' THEN 4
                    WHEN t.slug = 'bellmanford' THEN 5
                    WHEN t.slug = 'floydwarshall' THEN 6
                    WHEN t.slug = 'graph' THEN 7
                    ELSE 8
                END,
                problem_count DESC,
                t.name ASC
        """
        rows = conn.execute(query, params).fetchall()
        return [dict(row) for row in rows]
