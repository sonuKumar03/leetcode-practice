import sqlite3
from typing import Optional, Dict, Any

class TrackingRepository:
    @staticmethod
    def upsert_tracking(
        conn: sqlite3.Connection,
        problem_id: str,
        status: Optional[str] = None,
        is_starred: Optional[bool] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        existing = conn.execute("SELECT * FROM user_tracking WHERE problem_id = ?", (problem_id,)).fetchone()
        
        curr_status = existing["status"] if existing else "todo"
        curr_starred = bool(existing["is_starred"]) if existing else False
        curr_notes = existing["notes"] if existing else ""
        
        new_status = status if status is not None else curr_status
        new_starred = int(is_starred) if is_starred is not None else int(curr_starred)
        new_notes = notes if notes is not None else curr_notes

        conn.execute(
            """
            INSERT INTO user_tracking (problem_id, status, is_starred, notes, updated_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(problem_id) DO UPDATE SET
                status = excluded.status,
                is_starred = excluded.is_starred,
                notes = excluded.notes,
                updated_at = CURRENT_TIMESTAMP
            """,
            (problem_id, new_status, new_starred, new_notes)
        )
        
        row = conn.execute("SELECT * FROM user_tracking WHERE problem_id = ?", (problem_id,)).fetchone()
        return dict(row)

    @staticmethod
    def get_stats(conn: sqlite3.Connection, tag_slug: Optional[str] = None) -> Dict[str, Any]:
        # Overall counts
        overall_row = conn.execute("""
            SELECT 
                COUNT(p.id) as total_problems,
                COUNT(CASE WHEN ut.status = 'solved' THEN 1 END) as solved_problems,
                COUNT(CASE WHEN ut.status = 'in_progress' THEN 1 END) as in_progress_problems,
                COUNT(CASE WHEN ut.status IS NULL OR ut.status = 'todo' THEN 1 END) as todo_problems,
                COUNT(CASE WHEN ut.is_starred = 1 THEN 1 END) as starred_problems,
                COUNT(CASE WHEN p.difficulty = 'Easy' THEN 1 END) as easy_total,
                COUNT(CASE WHEN p.difficulty = 'Easy' AND ut.status = 'solved' THEN 1 END) as easy_solved,
                COUNT(CASE WHEN p.difficulty = 'Medium' THEN 1 END) as medium_total,
                COUNT(CASE WHEN p.difficulty = 'Medium' AND ut.status = 'solved' THEN 1 END) as medium_solved,
                COUNT(CASE WHEN p.difficulty = 'Hard' THEN 1 END) as hard_total,
                COUNT(CASE WHEN p.difficulty = 'Hard' AND ut.status = 'solved' THEN 1 END) as hard_solved
            FROM problems p
            LEFT JOIN user_tracking ut ON p.id = ut.problem_id
        """).fetchone()

        stats = dict(overall_row)
        total = stats["total_problems"]
        solved = stats["solved_problems"]
        stats["completion_percentage"] = round((solved / total * 100), 1) if total > 0 else 0.0

        # Calculate current streak (consecutive days with activity)
        streak_rows = conn.execute("""
            SELECT DISTINCT date(updated_at) as activity_date
            FROM user_tracking
            WHERE updated_at IS NOT NULL
            ORDER BY activity_date DESC
        """).fetchall()
        current_streak = 0
        if streak_rows:
            from datetime import date, timedelta
            today = date.today()
            expected = today
            for row in streak_rows:
                d = date.fromisoformat(row["activity_date"])
                if d == expected:
                    current_streak += 1
                    expected -= timedelta(days=1)
                elif d < expected:
                    break
            # If no activity today, check if yesterday starts the streak
            if current_streak == 0 and streak_rows:
                expected = today - timedelta(days=1)
                for row in streak_rows:
                    d = date.fromisoformat(row["activity_date"])
                    if d == expected:
                        current_streak += 1
                        expected -= timedelta(days=1)
                    elif d < expected:
                        break
        stats["current_streak"] = current_streak

        if tag_slug:
            tag_row = conn.execute("""
                SELECT 
                    t.name as tag_name,
                    COUNT(p.id) as tag_total,
                    COUNT(CASE WHEN ut.status = 'solved' THEN 1 END) as tag_solved
                FROM tags t
                JOIN problem_tags pt ON t.id = pt.tag_id
                JOIN problems p ON pt.problem_id = p.id
                LEFT JOIN user_tracking ut ON p.id = ut.problem_id
                WHERE t.slug = ?
                GROUP BY t.id
            """, (tag_slug,)).fetchone()
            if tag_row:
                stats["tag_name"] = tag_row["tag_name"]
                stats["tag_total"] = tag_row["tag_total"]
                stats["tag_solved"] = tag_row["tag_solved"]

        return stats
