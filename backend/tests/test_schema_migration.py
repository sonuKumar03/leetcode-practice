import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
import sqlite3
from app.db.session import init_db
from app.repositories.problem_repo import ProblemRepository
from app.adapters.base import RawProblemItem

class TestSchemaMigration(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect(":memory:")
        self.conn.row_factory = sqlite3.Row
        init_db(self.conn)

    def tearDown(self):
        self.conn.close()

    def test_frequency_column_and_index_exist(self):
        cursor = self.conn.cursor()
        cursor.execute("PRAGMA table_info(problems);")
        columns = [row["name"] for row in cursor.fetchall()]
        self.assertIn("frequency", columns)

    def test_auto_migration_adds_frequency_column(self):
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        conn.execute("""
            CREATE TABLE problems (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                slug TEXT NOT NULL,
                difficulty TEXT CHECK(difficulty IN ('Easy', 'Medium', 'Hard', 'Unknown')) DEFAULT 'Unknown',
                paid_only INTEGER DEFAULT 0,
                leetcode_url TEXT,
                doocs_url TEXT,
                source TEXT DEFAULT 'doocs',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        init_db(conn)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(problems);")
        columns = [row["name"] for row in cursor.fetchall()]
        self.assertIn("frequency", columns)
        conn.close()

    def test_batch_upsert_enriches_and_preserves_user_tracking(self):
        # 1. Insert initial problem and user tracking record
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO problems (id, title, slug, difficulty, frequency)
            VALUES ('1', 'Two Sum', 'two-sum', 'Easy', 0)
        """)
        cursor.execute("""
            INSERT INTO user_tracking (problem_id, status, is_starred, notes)
            VALUES ('1', 'Solved', 1, 'My custom note')
        """)
        self.conn.commit()

        # 2. Ingest enriched items
        item = RawProblemItem(
            slug="two-sum",
            leetcode_id="1",
            title="Two Sum",
            difficulty="Easy",
            topics=["Hash Table"],
            companies=["Google"],
            curated_lists=["Blind 75"],
            frequency_delta=10
        )
        stats = ProblemRepository.batch_upsert_enriched_problems([item], conn=self.conn)
        self.assertEqual(stats["upserted_problems"], 1)

        # 3. Check frequency incremented
        cursor.execute("SELECT frequency FROM problems WHERE slug = 'two-sum'")
        self.assertEqual(cursor.fetchone()["frequency"], 10)

        # 4. Check tags linked with respective types
        cursor.execute("""
            SELECT t.name, t.type FROM tags t
            JOIN problem_tags pt ON pt.tag_id = t.id
            WHERE pt.problem_id = '1'
        """)
        tags = {row["name"]: row["type"] for row in cursor.fetchall()}
        self.assertEqual(tags.get("Hash Table"), "topic")
        self.assertEqual(tags.get("Google"), "company")
        self.assertEqual(tags.get("Blind 75"), "list")

        # 5. Verify user tracking was untouched
        cursor.execute("SELECT status, is_starred, notes FROM user_tracking WHERE problem_id = '1'")
        tracking = cursor.fetchone()
        self.assertEqual(tracking["status"], "Solved")
        self.assertEqual(tracking["is_starred"], 1)
        self.assertEqual(tracking["notes"], "My custom note")

    def test_batch_upsert_creates_new_problem_when_absent(self):
        item = RawProblemItem(
            slug="median-of-two-sorted-arrays",
            title="Median of Two Sorted Arrays",
            difficulty="Hard",
            topics=["Binary Search", "Divide and Conquer"],
            frequency_delta=3
        )
        stats = ProblemRepository.batch_upsert_enriched_problems([item], conn=self.conn)
        self.assertEqual(stats["upserted_problems"], 1)
        self.assertEqual(stats["tags_linked"], 2)

        cursor = self.conn.cursor()
        cursor.execute("SELECT id, title, difficulty, frequency, leetcode_url FROM problems WHERE slug = 'median-of-two-sorted-arrays'")
        row = cursor.fetchone()
        self.assertIsNotNone(row)
        self.assertEqual(row["title"], "Median of Two Sorted Arrays")
        self.assertEqual(row["difficulty"], "Hard")
        self.assertEqual(row["frequency"], 3)
        self.assertIn("median-of-two-sorted-arrays", row["leetcode_url"])

    def test_batch_upsert_reuses_existing_tags(self):
        item1 = RawProblemItem(
            slug="p1",
            leetcode_id="101",
            title="Problem 1",
            topics=["Dynamic Programming"],
            companies=["Amazon"],
        )
        item2 = RawProblemItem(
            slug="p2",
            leetcode_id="102",
            title="Problem 2",
            topics=["Dynamic Programming"],
            companies=["Amazon"],
        )
        ProblemRepository.batch_upsert_enriched_problems([item1, item2], conn=self.conn)

        cursor = self.conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM tags WHERE name = 'Dynamic Programming'")
        self.assertEqual(cursor.fetchone()["count"], 1)
        cursor.execute("SELECT COUNT(*) as count FROM tags WHERE name = 'Amazon'")
        self.assertEqual(cursor.fetchone()["count"], 1)

if __name__ == "__main__":
    unittest.main()
