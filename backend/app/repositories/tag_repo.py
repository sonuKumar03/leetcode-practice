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
    def list_tags(conn: sqlite3.Connection, tag_type: Optional[str] = None) -> List[Dict[str, Any]]:
        where_clause = ""
        params = []
        if tag_type:
            where_clause = "WHERE t.type = ?"
            params.append(tag_type)

        query = f"""
            SELECT t.id, t.name, t.slug, COALESCE(t.type, 'topic') as type, COUNT(pt.problem_id) as problem_count
            FROM tags t
            LEFT JOIN problem_tags pt ON t.id = pt.tag_id
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
