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
        resp = requests.get(self.url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        # Upstream now wraps entries as {"updated": ..., "data": [...]}; older dumps were a bare list.
        entries = data.get("data", []) if isinstance(data, dict) else data

        url_regex = re.compile(r"leetcode\.com/problems/([^/]+)")
        for entry in entries:
            if not isinstance(entry, dict):
                continue
            match = url_regex.search(entry.get("url", ""))
            slug = (entry.get("slug") or (match.group(1) if match else "")).lower().strip()
            if not slug:
                continue

            pattern = entry.get("pattern")
            topics = pattern if isinstance(pattern, list) else ([pattern] if pattern else [])
            companies = [
                c["name"] for c in entry.get("companies", [])
                if isinstance(c, dict) and c.get("name")
            ]

            yield RawProblemItem(
                slug=slug,
                title=entry.get("title") or entry.get("name"),
                difficulty=entry.get("difficulty"),
                paid_only=bool(entry.get("premium", False)),
                topics=topics,
                companies=companies,
                curated_lists=entry.get("lists") or ["Curated Study Plan"],
                frequency_delta=2,
            )
