import logging
import requests
from typing import Iterable
from app.adapters.base import BaseSourceAdapter, RawProblemItem
from app.adapters.registry import AdapterRegistry
from app.config import LEETCODE_API_URL

logger = logging.getLogger(__name__)

@AdapterRegistry.register
class LeetCodeOfficialCatalogAdapter(BaseSourceAdapter):
    name = "leetcode_catalog"
    description = "Official LeetCode problem catalog (slugs, IDs, difficulty, premium status)"
    enabled_by_default = True

    def __init__(self, api_url: str = LEETCODE_API_URL):
        self.api_url = api_url

    def fetch(self) -> Iterable[RawProblemItem]:
        logger.info(f"Fetching LeetCode catalog from {self.api_url}...")
        try:
            resp = requests.get(
                self.api_url,
                headers={"User-Agent": "Mozilla/5.0"},
                timeout=15
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.error(f"Catalog fetch failed: {e}")
            return

        diff_map = {1: "Easy", 2: "Medium", 3: "Hard"}
        for item in data.get("stat_status_pairs", []):
            stat = item.get("stat", {})
            slug = stat.get("question__title_slug")
            if not slug:
                continue

            fid = str(stat.get("frontend_question_id", ""))
            title = stat.get("question__title", "")
            level = item.get("difficulty", {}).get("level", 2)
            paid_only = bool(item.get("paid_only", False))

            yield RawProblemItem(
                slug=slug,
                leetcode_id=fid,
                title=title,
                difficulty=diff_map.get(level, "Medium"),
                paid_only=paid_only,
                frequency_delta=0
            )
