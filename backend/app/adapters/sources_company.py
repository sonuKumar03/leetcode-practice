import csv
import io
import re
import logging
import requests
from typing import Iterable, List, Optional
from app.adapters.base import BaseSourceAdapter, RawProblemItem
from app.adapters.registry import AdapterRegistry

logger = logging.getLogger(__name__)

REPO_CONTENTS_URL = "https://api.github.com/repos/hxu296/leetcode-company-wise-problems-2022/contents/companies"
RAW_CSV_BASE_URL = "https://raw.githubusercontent.com/hxu296/leetcode-company-wise-problems-2022/main/companies"

URL_REGEX = re.compile(r"leetcode\.com/problems/([^/]+)")

@AdapterRegistry.register
class CompanyWiseCsvAdapter(BaseSourceAdapter):
    name = "company_wise"
    description = "Company-wise interview frequency lists (187 companies with genuine occurrence counts)"
    enabled_by_default = True

    def __init__(self, companies: Optional[List[str]] = None):
        self.companies = companies  # If None, automatically scans all available companies

    def _get_company_file_names(self) -> List[str]:
        if self.companies:
            return [f"{c.strip()}.csv" if not c.endswith(".csv") else c for c in self.companies]

        logger.info(f"Discovering company CSV files from {REPO_CONTENTS_URL}...")
        try:
            resp = requests.get(REPO_CONTENTS_URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
            resp.raise_for_status()
            files = [item["name"] for item in resp.json() if item.get("name", "").endswith(".csv")]
            return files
        except Exception as e:
            logger.warning(f"Could not discover company list dynamically ({e}), falling back to top companies")
            return [
                "Google.csv", "Amazon.csv", "Meta.csv", "Microsoft.csv",
                "Apple.csv", "Bloomberg.csv", "Uber.csv", "Netflix.csv"
            ]

    def fetch(self) -> Iterable[RawProblemItem]:
        file_names = self._get_company_file_names()
        logger.info(f"Processing {len(file_names)} company CSV files...")

        failed = 0
        for filename in file_names:

            company_name = filename.replace(".csv", "").replace("%20", " ")
            csv_url = f"{RAW_CSV_BASE_URL}/{filename}"
            try:
                resp = requests.get(csv_url, headers={"User-Agent": "Mozilla/5.0"}, timeout=15)
                if resp.status_code != 200:
                    failed += 1
                    continue

                reader = csv.DictReader(io.StringIO(resp.text))
                for row in reader:
                    link = row.get("problem_link") or row.get("url") or ""
                    match = URL_REGEX.search(link)
                    if not match:
                        continue
                    slug = match.group(1).lower().strip()
                    title = row.get("problem_name") or row.get("title")

                    # Parse occurrences
                    occur_str = row.get("num_occur", "1")
                    try:
                        occur = int(float(occur_str))
                    except (ValueError, TypeError):
                        occur = 1

                    yield RawProblemItem(
                        slug=slug,
                        title=title,
                        companies=[company_name],
                        frequency_delta=max(occur, 1)
                    )
            except Exception as e:
                failed += 1
                logger.warning(f"Failed to process company {company_name}: {e}")

        if file_names and failed == len(file_names):
            raise RuntimeError(f"All {failed} company CSV downloads failed")
