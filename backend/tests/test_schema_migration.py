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
        self.assertIn("updated_at", columns)
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

    def test_batch_upsert_skips_unknown_slug_without_id(self):
        item = RawProblemItem(slug="brand-new", title="Brand New", topics=["Array"], frequency_delta=3)
        stats = ProblemRepository.batch_upsert_enriched_problems([item], conn=self.conn)
        self.assertEqual(stats["upserted_problems"], 0)
        self.assertEqual(stats["skipped_unknown_id"], 1)
        self.assertEqual(self.conn.execute("SELECT COUNT(*) c FROM problems").fetchone()["c"], 0)

    def test_batch_upsert_does_not_overwrite_id_owned_by_other_slug(self):
        self.conn.execute("INSERT INTO problems (id, title, slug) VALUES ('7', 'Seven', 'seven')")
        item = RawProblemItem(slug="other", leetcode_id="7", title="Other")
        stats = ProblemRepository.batch_upsert_enriched_problems([item], conn=self.conn)
        self.assertEqual(stats["skipped_unknown_id"], 1)
        self.assertEqual(self.conn.execute("SELECT slug FROM problems WHERE id='7'").fetchone()["slug"], "seven")

    def test_frequency_sums_sources_and_replaces_per_source(self):
        mk = lambda d: RawProblemItem(slug="two-sum", leetcode_id="1", title="Two Sum", frequency_delta=d)
        up = ProblemRepository.batch_upsert_enriched_problems
        up([mk(10)], conn=self.conn, source="a")
        up([mk(4)], conn=self.conn, source="b")
        up([mk(10)], conn=self.conn, source="a")  # re-run must not double count
        self.assertEqual(self.conn.execute("SELECT frequency FROM problems WHERE id='1'").fetchone()[0], 14)

    def test_only_catalog_overwrites_title_and_difficulty(self):
        up = ProblemRepository.batch_upsert_enriched_problems
        up([RawProblemItem(slug="two-sum", leetcode_id="1", title="Two Sum", difficulty="Easy", paid_only=True)],
           conn=self.conn, source="leetcode_catalog")
        up([RawProblemItem(slug="two-sum", title="two sum!!", difficulty="Hard")], conn=self.conn, source="markdown_repos")
        row = self.conn.execute("SELECT title, difficulty, paid_only FROM problems WHERE id='1'").fetchone()
        self.assertEqual((row["title"], row["difficulty"], row["paid_only"]), ("Two Sum", "Easy", 1))
        up([RawProblemItem(slug="two-sum", title="Two Sum II", difficulty="Medium")], conn=self.conn, source="leetcode_catalog")
        row = self.conn.execute("SELECT title, difficulty FROM problems WHERE id='1'").fetchone()
        self.assertEqual((row["title"], row["difficulty"]), ("Two Sum II", "Medium"))

    def test_tag_slug_clash_keeps_types_separate(self):
        item = RawProblemItem(slug="p", leetcode_id="9", title="P", topics=["Stack"], companies=["Stack"])
        ProblemRepository.batch_upsert_enriched_problems([item], conn=self.conn)
        types = {r["type"] for r in self.conn.execute("SELECT type FROM tags WHERE name LIKE 'Stack%'")}
        self.assertEqual(types, {"topic", "company"})

    def test_tag_clash_with_legacy_unique_name_schema(self):
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        conn.executescript("""
            CREATE TABLE problems (id TEXT PRIMARY KEY, title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE,
                difficulty TEXT DEFAULT 'Unknown', paid_only INTEGER DEFAULT 0, leetcode_url TEXT, doocs_url TEXT,
                source TEXT DEFAULT 'doocs', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
            CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE NOT NULL,
                slug TEXT UNIQUE NOT NULL, type TEXT DEFAULT 'topic');
            INSERT INTO tags (name, slug, type) VALUES ('Arista Networks', 'arista', 'company');
        """)
        init_db(conn)
        item = RawProblemItem(slug="p", leetcode_id="9", title="P", topics=["Stack"],
                              companies=["Arista Networks", "arista networks", "Stack"])
        ProblemRepository.batch_upsert_enriched_problems([item], conn=conn)
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM tags WHERE type='company' AND name LIKE 'Arista%'").fetchone()[0], 1)
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM problem_tags").fetchone()[0], 3)
        conn.close()

    def test_batch_upsert_creates_new_problem_when_absent(self):
        item = RawProblemItem(
            slug="median-of-two-sorted-arrays",
            leetcode_id="4",
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
