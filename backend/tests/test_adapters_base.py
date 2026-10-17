import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
from typing import Iterable
from app.adapters.base import RawProblemItem, BaseSourceAdapter
from app.adapters.registry import AdapterRegistry

class DummyAdapter(BaseSourceAdapter):
    name = "dummy"
    description = "Dummy test adapter"
    enabled_by_default = True

    def fetch(self) -> Iterable[RawProblemItem]:
        yield RawProblemItem(
            slug="two-sum",
            leetcode_id="1",
            title="Two Sum",
            difficulty="Easy",
            topics=["Array", "Hash Table"],
            companies=["Google"],
            curated_lists=["Blind 75"],
            frequency_delta=5
        )

class TestAdaptersBase(unittest.TestCase):
    def setUp(self):
        AdapterRegistry.clear()

    def test_raw_problem_item_defaults(self):
        item = RawProblemItem(slug="3sum")
        self.assertEqual(item.slug, "3sum")
        self.assertIsNone(item.leetcode_id)
        self.assertEqual(item.frequency_delta, 1)
        self.assertEqual(item.topics, [])
        self.assertEqual(item.companies, [])
        self.assertEqual(item.curated_lists, [])

    def test_adapter_registry_registration_and_lookup(self):
        AdapterRegistry.register(DummyAdapter)
        self.assertIn("dummy", AdapterRegistry.get_all())
        adapter = AdapterRegistry.get("dummy")
        self.assertIsInstance(adapter, DummyAdapter)
        
        items = list(adapter.fetch())
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].slug, "two-sum")
        self.assertEqual(items[0].frequency_delta, 5)

    def test_registry_metadata_listing(self):
        AdapterRegistry.register(DummyAdapter)
        meta = AdapterRegistry.list_metadata()
        self.assertEqual(len(meta), 1)
        self.assertEqual(meta[0]["name"], "dummy")
        self.assertEqual(meta[0]["description"], "Dummy test adapter")
        self.assertTrue(meta[0]["enabled_by_default"])

if __name__ == "__main__":
    unittest.main()
