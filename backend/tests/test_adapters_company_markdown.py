import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import unittest
from unittest.mock import patch, MagicMock
from app.adapters.sources_company import CompanyWiseCsvAdapter
from app.adapters.sources_markdown import GitHubMarkdownAdapter
from app.adapters.registry import AdapterRegistry

class TestAdaptersCompanyMarkdown(unittest.TestCase):
    def setUp(self):
        AdapterRegistry.register(CompanyWiseCsvAdapter)
        AdapterRegistry.register(GitHubMarkdownAdapter)
    @patch("requests.get")
    def test_company_adapter_parses_csv_occurrences(self, mock_get):
        # Mock single company CSV content
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = (
            "problem_link,problem_name,num_occur\n"
            "https://leetcode.com/problems/two-sum/,Two Sum,72\n"
            "https://leetcode.com/problems/lru-cache/,LRU Cache,45\n"
        )
        mock_get.return_value = mock_resp

        adapter = CompanyWiseCsvAdapter(companies=["Google"])
        items = list(adapter.fetch())
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0].slug, "two-sum")
        self.assertIn("Google", items[0].companies)
        self.assertEqual(items[0].frequency_delta, 72)
        self.assertEqual(items[1].slug, "lru-cache")
        self.assertEqual(items[1].frequency_delta, 45)

    @patch("requests.get")
    def test_company_adapter_dynamic_discovery_and_fallback(self, mock_get):
        # Test fallback when discovery fails
        mock_get.side_effect = Exception("GitHub API rate limit")
        adapter = CompanyWiseCsvAdapter(companies=None)
        files = adapter._get_company_file_names()
        self.assertIn("Google.csv", files)
        self.assertIn("Amazon.csv", files)

    @patch("requests.get")
    def test_markdown_adapter_extracts_links(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = """
| # | Title | Solution | Difficulty |
|---|-------|----------|------------|
| 1 | [Two Sum](https://leetcode.com/problems/two-sum/) | [C++](...) | Easy |
| 15 | [3Sum](https://leetcode.com/problems/3sum/) | [Python](...) | Medium |
        """
        mock_get.return_value = mock_resp

        adapter = GitHubMarkdownAdapter(urls=["https://raw.githubusercontent.com/test/repo/README.md"])
        items = list(adapter.fetch())
        self.assertEqual(len(items), 2)
        self.assertEqual(items[0].slug, "two-sum")
        self.assertEqual(items[0].difficulty, "Easy")
        self.assertEqual(items[1].slug, "3sum")
        self.assertEqual(items[1].difficulty, "Medium")

    @patch("requests.get")
    def test_markdown_adapter_raw_urls_fallback(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.text = """
Some random notes with a link: https://leetcode.com/problems/invert-binary-tree/ and more text.
        """
        mock_get.return_value = mock_resp

        adapter = GitHubMarkdownAdapter(urls=["https://raw.githubusercontent.com/test/repo/README.md"])
        items = list(adapter.fetch())
        self.assertEqual(len(items), 1)
        self.assertEqual(items[0].slug, "invert-binary-tree")

    def test_adapters_are_registered_in_registry(self):
        registered = [m["name"] for m in AdapterRegistry.list_metadata()]
        self.assertIn("company_wise", registered)
        self.assertIn("markdown_repos", registered)

if __name__ == "__main__":
    unittest.main()
