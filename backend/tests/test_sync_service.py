import unittest
import sqlite3
from unittest.mock import patch, MagicMock
from app.db.session import init_db
from app.services.sync_service import SyncPipelineService
from app.adapters.registry import AdapterRegistry
from app.adapters.base import BaseSourceAdapter, RawProblemItem


class MockSyncAdapter(BaseSourceAdapter):
    name = "mock_sync"
    description = "Mock sync adapter"
    enabled_by_default = True

    def fetch(self):
        yield RawProblemItem(
            slug="merge-intervals",
            leetcode_id="56",
            title="Merge Intervals",
            difficulty="Medium",
            topics=["Sorting", "Array"],
            companies=["Google", "Meta"],
            curated_lists=["Blind 75"],
            frequency_delta=20
        )


class MockMultiItemAdapter(BaseSourceAdapter):
    name = "mock_multi"
    description = "Mock multi-item adapter"
    enabled_by_default = False

    def fetch(self):
        yield RawProblemItem(
            slug="two-sum",
            leetcode_id="1",
            title="Two Sum",
            difficulty="Easy",
            topics=["Array"],
            companies=["Amazon"],
            curated_lists=["Blind 75"],
            frequency_delta=10
        )
        yield RawProblemItem(
            slug="two-sum",
            leetcode_id="1",
            title="Two Sum",
            difficulty="Easy",
            topics=["Hash Table"],
            companies=["Google"],
            curated_lists=["NeetCode 150"],
            frequency_delta=15
        )


class MockFailingAdapter(BaseSourceAdapter):
    name = "mock_failing"
    description = "Mock failing adapter"
    enabled_by_default = False

    def fetch(self):
        raise RuntimeError("External API failure")


class TestSyncService(unittest.TestCase):
    def setUp(self):
        self.conn = sqlite3.connect(":memory:")
        self.conn.row_factory = sqlite3.Row
        init_db(self.conn)
        AdapterRegistry.clear()
        AdapterRegistry.register(MockSyncAdapter)
        AdapterRegistry.register(MockMultiItemAdapter)
        AdapterRegistry.register(MockFailingAdapter)

    def tearDown(self):
        self.conn.close()

    def test_run_sync_pipeline(self):
        service = SyncPipelineService(conn_factory=lambda: self.conn)
        result = service.run_sync(adapter_names=["mock_sync"])

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["adapters_run"], ["mock_sync"])
        self.assertGreaterEqual(result["total_upserted_problems"], 1)

        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM problems WHERE slug = 'merge-intervals'")
        prob = cursor.fetchone()
        self.assertIsNotNone(prob)
        self.assertEqual(prob["title"], "Merge Intervals")
        self.assertEqual(prob["difficulty"], "Medium")
        self.assertEqual(prob["frequency"], 20)

        cursor.execute("SELECT name, type FROM tags")
        tag_types = {row["name"]: row["type"] for row in cursor.fetchall()}
        self.assertEqual(tag_types["Blind 75"], "list")
        self.assertEqual(tag_types["Google"], "company")
        self.assertEqual(tag_types["Sorting"], "topic")

    def test_sync_status_reporting(self):
        service = SyncPipelineService(conn_factory=lambda: self.conn)
        result = service.run_sync(adapter_names=["mock_sync"])
        self.assertEqual(result["status"], "success")

        status = SyncPipelineService.get_sync_status()
        self.assertEqual(status["status"], "completed")
        self.assertEqual(status["progress_percent"], 100)
        self.assertIsNotNone(status["last_result"])

    def test_sync_aggregation_same_slug(self):
        service = SyncPipelineService(conn_factory=lambda: self.conn)
        result = service.run_sync(adapter_names=["mock_multi"])

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["total_items_processed"], 2)
        self.assertEqual(result["total_upserted_problems"], 1)

        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM problems WHERE slug = 'two-sum'")
        prob = cursor.fetchone()
        self.assertIsNotNone(prob)
        self.assertEqual(prob["frequency"], 25)

        cursor.execute("""
            SELECT t.name, t.type FROM tags t
            JOIN problem_tags pt ON t.id = pt.tag_id
            WHERE pt.problem_id = ?
        """, (prob["id"],))
        tags = cursor.fetchall()
        tag_names = {row["name"] for row in tags}
        self.assertIn("Array", tag_names)
        self.assertIn("Hash Table", tag_names)
        self.assertIn("Amazon", tag_names)
        self.assertIn("Google", tag_names)
        self.assertIn("Blind 75", tag_names)
        self.assertIn("NeetCode 150", tag_names)

    def test_sync_preserves_user_tracking(self):
        # Insert pre-existing problem with user tracking
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO problems (id, title, slug, difficulty, frequency)
            VALUES ('56', 'Old Title', 'merge-intervals', 'Easy', 5)
        """)
        cursor.execute("""
            INSERT INTO users (id, email, password_hash)
            VALUES ('u1', 'test@test.com', 'hash')
        """)
        cursor.execute("""
            INSERT INTO user_tracking (user_id, problem_id, status, is_starred, notes)
            VALUES ('u1', '56', 'Solved', 1, 'Review binary search pattern')
        """)
        self.conn.commit()

        service = SyncPipelineService(conn_factory=lambda: self.conn)
        result = service.run_sync(adapter_names=["mock_sync"])
        self.assertEqual(result["status"], "success")

        # Non-authoritative source: existing title/difficulty are kept
        cursor.execute("SELECT * FROM problems WHERE id = '56'")
        prob = cursor.fetchone()
        self.assertEqual(prob["title"], "Old Title")
        self.assertEqual(prob["difficulty"], "Easy")
        self.assertEqual(prob["frequency"], 20)  # source contribution replaces the old value

        # Verify user tracking was strictly preserved
        cursor.execute("SELECT * FROM user_tracking WHERE problem_id = '56'")
        tracking = cursor.fetchone()
        self.assertIsNotNone(tracking)
        self.assertEqual(tracking["status"], "Solved")
        self.assertEqual(tracking["is_starred"], 1)
        self.assertEqual(tracking["notes"], "Review binary search pattern")

    def test_sync_pipeline_error_handling(self):
        service = SyncPipelineService(conn_factory=lambda: self.conn)
        result = service.run_sync(adapter_names=["mock_failing"])

        self.assertEqual(result["status"], "error")
        self.assertIn("External API failure", result["error"])
        self.assertIn("mock_failing", result["adapter_errors"])

        status = SyncPipelineService.get_sync_status()
        self.assertEqual(status["status"], "failed")
        self.assertIn("External API failure", status["error"])

    def test_sync_unknown_adapter_skipped(self):
        service = SyncPipelineService(conn_factory=lambda: self.conn)
        result = service.run_sync(adapter_names=["non_existent_adapter", "mock_sync"])

        self.assertEqual(result["status"], "success")
        self.assertEqual(result["total_upserted_problems"], 1)

    def test_sync_is_idempotent(self):
        service = SyncPipelineService(conn_factory=lambda: self.conn)
        for _ in range(3):
            self.assertEqual(service.run_sync(adapter_names=["mock_sync"])["status"], "success")
        row = self.conn.execute("SELECT frequency FROM problems WHERE slug='merge-intervals'").fetchone()
        self.assertEqual(row["frequency"], 20)

    def test_failing_adapter_does_not_block_others(self):
        service = SyncPipelineService(conn_factory=lambda: self.conn)
        result = service.run_sync(adapter_names=["mock_failing", "mock_sync"])
        self.assertEqual(result["status"], "partial")
        self.assertEqual(result["adapters_run"], ["mock_sync"])
        self.assertIn("mock_failing", result["adapter_errors"])
        self.assertIsNotNone(self.conn.execute("SELECT 1 FROM problems WHERE slug='merge-intervals'").fetchone())
        self.assertEqual(SyncPipelineService.get_sync_status()["status"], "completed")

    def test_concurrent_sync_rejected(self):
        service = SyncPipelineService(conn_factory=lambda: self.conn)
        self.assertTrue(SyncPipelineService._lock.acquire(blocking=False))
        try:
            result = service.run_sync(adapter_names=["mock_sync"])
        finally:
            SyncPipelineService._lock.release()
        self.assertEqual(result["status"], "error")
        self.assertIn("already in progress", result["error"])


if __name__ == "__main__":
    unittest.main()
