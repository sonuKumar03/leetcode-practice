import re
import logging
import requests
from typing import Iterable
from app.adapters.base import BaseSourceAdapter, RawProblemItem
from app.adapters.registry import AdapterRegistry

logger = logging.getLogger(__name__)

SEANPRASHAD_URL = "https://raw.githubusercontent.com/seanprashad/leetcode-patterns/master/src/data/questions.json"

@AdapterRegistry.register
class CuratedPatternAdapter(BaseSourceAdapter):
    name = "curated_patterns"
    description = "Curated study lists (Blind 75, NeetCode 150) and algorithmic pattern classifications"
    enabled_by_default = True

    def __init__(self, url: str = SEANPRASHAD_URL):
        self.url = url

    def fetch(self) -> Iterable[RawProblemItem]:
        logger.info(f"Fetching curated patterns from {self.url}...")
        try:
            resp = requests.get(self.url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            logger.error(f"Curated patterns fetch failed: {e}")
            return

        url_regex = re.compile(r"leetcode\.com/problems/([^/]+)")
        for entry in data:
            raw_url = entry.get("url", "")
            match = url_regex.search(raw_url)
            slug = match.group(1).lower().strip() if match else None
            if not slug:
                continue

            pattern = entry.get("pattern")
            diff = entry.get("difficulty")
            title = entry.get("name")
            curated_lists = entry.get("lists", ["Curated Study Plan"])

            yield RawProblemItem(
                slug=slug,
                title=title,
                difficulty=diff,
                topics=[pattern] if pattern else [],
                curated_lists=curated_lists,
                frequency_delta=2
            )
