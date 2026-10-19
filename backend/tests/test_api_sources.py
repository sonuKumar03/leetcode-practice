import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import io
import unittest
from unittest.mock import patch
from contextlib import redirect_stdout
from fastapi.testclient import TestClient
from app.main import app
from app.cli import main as cli_main

class TestApiSources(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_get_sources_list(self):
        resp = self.client.get("/api/v1/sources")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("adapters", data)
        names = [a["name"] for a in data["adapters"]]
        self.assertIn("leetcode_catalog", names)

    def test_get_sync_status(self):
        resp = self.client.get("/api/v1/sources/sync/status")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("status", data)

    @patch("app.api.sources.SyncPipelineService.run_sync")
    def test_trigger_sync(self, mock_run_sync):
        resp = self.client.post("/api/v1/sources/sync", json={"adapters": ["leetcode_catalog"]})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data.get("status"), "started")
        mock_run_sync.assert_called_once_with(["leetcode_catalog"])

    @patch("app.api.sources.SyncPipelineService.is_running", return_value=True)
    def test_trigger_sync_conflict_when_running(self, _):
        resp = self.client.post("/api/v1/sources/sync", json={})
        self.assertEqual(resp.status_code, 409)

    def test_trigger_sync_unknown_adapter(self):
        resp = self.client.post("/api/v1/sources/sync", json={"adapters": ["nope"]})
        self.assertEqual(resp.status_code, 422)

    @patch.dict("os.environ", {"SYNC_API_TOKEN": "secret"})
    @patch("app.api.sources.SyncPipelineService.run_sync")
    def test_trigger_sync_requires_token_when_configured(self, mock_run_sync):
        self.assertEqual(self.client.post("/api/v1/sources/sync", json={}).status_code, 401)
        resp = self.client.post("/api/v1/sources/sync", json={}, headers={"X-API-Key": "secret"})
        self.assertEqual(resp.status_code, 200)

    @patch("sys.argv", ["cli.py", "sync", "--list"])
    def test_cli_sync_list(self):
        with io.StringIO() as buf, redirect_stdout(buf):
            cli_main()
            output = buf.getvalue()
            self.assertIn("Registered Source Adapters:", output)
            self.assertIn("leetcode_catalog", output)

    @patch("app.cli.SyncPipelineService.run_sync")
    @patch("sys.argv", ["cli.py", "sync", "--adapter", "leetcode_catalog"])
    def test_cli_sync_adapter(self, mock_run_sync):
        mock_run_sync.return_value = {"status": "success", "total_items_processed": 10}
        with io.StringIO() as buf, redirect_stdout(buf):
            cli_main()
            output = buf.getvalue()
            self.assertIn("Sync Results:", output)
            self.assertIn("total_items_processed: 10", output)
        mock_run_sync.assert_called_once_with(adapter_names=["leetcode_catalog"])

    @patch("sys.argv", ["cli.py"])
    def test_cli_no_args_shows_help(self):
        with io.StringIO() as buf, redirect_stdout(buf):
            cli_main()
            output = buf.getvalue()
            self.assertIn("usage:", output.lower())

if __name__ == "__main__":
    unittest.main()
