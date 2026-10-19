import re
import logging
import requests
from typing import Iterable, List, Optional
from app.adapters.base import BaseSourceAdapter, RawProblemItem
from app.adapters.registry import AdapterRegistry

logger = logging.getLogger(__name__)

DEFAULT_MARKDOWN_URLS = [
    "https://raw.githubusercontent.com/qiyuangong/leetcode/master/README.md",
    "https://raw.githubusercontent.com/haoel/leetcode/master/README.md",
]

URL_REGEX = re.compile(r"leetcode\.com/problems/([^/\)\"]+)")
ROW_REGEX = re.compile(
    r"\|\s*(\d+)?\s*\|\s*\[([^\]]+)\]\((https?://[^)]+)\)\s*\|.*?\|\s*(Easy|Medium|Hard)\s*\|",
    re.IGNORECASE,
)

@AdapterRegistry.register
class GitHubMarkdownAdapter(BaseSourceAdapter):
    name = "markdown_repos"
    description = "Community GitHub Markdown problem tables and link scrapers"
    enabled_by_default = True

    def __init__(self, urls: Optional[List[str]] = None):
        self.urls = urls or DEFAULT_MARKDOWN_URLS

    def fetch(self) -> Iterable[RawProblemItem]:
        failed = 0
        for url in self.urls:
            logger.info(f"Scanning Markdown from {url}...")
            try:
                resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
                if resp.status_code != 200:
                    failed += 1
                    continue

                for line in resp.text.splitlines():
                    row_match = ROW_REGEX.search(line)
                    if row_match:
                        prob_id = row_match.group(1) or None
                        title = row_match.group(2)
                        link = row_match.group(3)
                        diff = row_match.group(4).capitalize()
                        slug_match = URL_REGEX.search(link)
                        slug = slug_match.group(1).lower() if slug_match else None
                        if slug:
                            yield RawProblemItem(
                                slug=slug,
                                leetcode_id=prob_id,
                                title=title,
                                difficulty=diff,
                                frequency_delta=1
                            )
            except Exception as e:
                failed += 1
                logger.warning(f"Error scanning markdown source {url}: {e}")

        if self.urls and failed == len(self.urls):
            raise RuntimeError(f"All {failed} markdown sources failed")

