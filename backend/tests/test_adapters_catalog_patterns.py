import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
from unittest.mock import patch, MagicMock
from app.adapters.sources_catalog import LeetCodeOfficialCatalogAdapter
from app.adapters.sources_patterns import CuratedPatternAdapter
from app.adapters.registry import AdapterRegistry

class TestAdaptersCatalogPatterns(unittest.TestCase):
    def setUp(self):
        AdapterRegistry.register(LeetCodeOfficialCatalogAdapter)
        AdapterRegistry.register(CuratedPatternAdapter)

    @patch("requests.get")
    def test_catalog_adapter_fetches_and_parses(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "stat_status_pairs": [
                {
                    "stat": {
                        "frontend_question_id": 1,
                        "question__title": "Two Sum",
                        "question__title_slug": "two-sum"
                    },
                    "difficulty": {"level": 1},
                    "paid_only": False
                }
            ]
        }
        mock_get.return_value = mock_resp

        adapter = LeetCodeOfficialCatalogAdapter()
        items = list(adapter.fetch())
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].slug, "two-sum")
        self.assertEqual(items[0].leetcode_id, "1")
        self.assertEqual(items[0].title, "Two Sum")
        self.assertEqual(items[0].difficulty, "Easy")
        self.assertFalse(items[0].paid_only)

    @patch("requests.get")
    def test_catalog_adapter_handles_network_error(self, mock_get):
        mock_get.side_effect = Exception("Connection error")
        adapter = LeetCodeOfficialCatalogAdapter()
        items = list(adapter.fetch())
        self.assertEqual(items, [])

    @patch("requests.get")
    def test_patterns_adapter_parses_curated_lists(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = [
            {
                "name": "Best Time to Buy and Sell Stock",
                "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
                "pattern": "Sliding Window",
                "difficulty": "Easy",
                "lists": ["Blind 75", "NeetCode 150"]
            }
        ]
        mock_get.return_value = mock_resp

        adapter = CuratedPatternAdapter()
        items = list(adapter.fetch())
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].slug, "best-time-to-buy-and-sell-stock")
        self.assertIn("Sliding Window", items[0].topics)
        self.assertIn("Blind 75", items[0].curated_lists)
        self.assertIn("NeetCode 150", items[0].curated_lists)

    @patch("requests.get")
    def test_patterns_adapter_handles_network_error(self, mock_get):
        mock_get.side_effect = Exception("Connection error")
        adapter = CuratedPatternAdapter()
        items = list(adapter.fetch())
        self.assertEqual(items, [])

    def test_adapters_are_registered_in_registry(self):
        registered = [m["name"] for m in AdapterRegistry.list_metadata()]
        self.assertIn("leetcode_catalog", registered)
        self.assertIn("curated_patterns", registered)

if __name__ == "__main__":
    unittest.main()
