import json
import logging
import urllib.request
from typing import Any, Dict, List

from bs4 import BeautifulSoup
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.config import DOOCS_TAGS_URL, LEETCODE_API_URL
from app.db.models import Problem, ProblemTag
from app.db.session import get_db, init_db
from app.repositories.tag_repo import TagRepository, slugify

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScraperService:
    @staticmethod
    def fetch_leetcode_metadata() -> Dict[str, Dict[str, Any]]:
        logger.info(f"Fetching LeetCode metadata from {LEETCODE_API_URL}...")
        try:
            req = urllib.request.Request(
                LEETCODE_API_URL,
                headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            diff_map = {1: "Easy", 2: "Medium", 3: "Hard"}
            meta: Dict[str, Dict[str, Any]] = {}
            for item in data.get("stat_status_pairs", []):
                stat = item.get("stat", {})
                frontend_id = str(stat.get("frontend_question_id", ""))
                slug = stat.get("question__title_slug", "")
                title = stat.get("question__title", "")
                level = item.get("difficulty", {}).get("level", 0)
                paid_only = bool(item.get("paid_only", False))

                if frontend_id:
                    meta[frontend_id] = {
                        "slug": slug,
                        "title": title,
                        "difficulty": diff_map.get(level, "Unknown"),
                        "paid_only": paid_only,
                        "leetcode_url": f"https://leetcode.com/problems/{slug}/" if slug else "",
                    }
            logger.info(f"Loaded {len(meta)} problems metadata from LeetCode API.")
            return meta
        except Exception as e:
            logger.warning(f"Could not fetch LeetCode API metadata ({e}). Will proceed with scraped titles.")
            return {}

    @staticmethod
    def scrape_and_seed() -> Dict[str, Any]:
        init_db()
        logger.info(f"Scraping Doocs tags from {DOOCS_TAGS_URL}...")

        req = urllib.request.Request(
            DOOCS_TAGS_URL,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            html = resp.read().decode("utf-8", errors="ignore")

        soup = BeautifulSoup(html, "html.parser")
        tag_headings = soup.find_all("h2", id=lambda x: x and x.startswith("tag:"))
        logger.info(f"Found {len(tag_headings)} algorithm tags.")

        lc_meta = ScraperService.fetch_leetcode_metadata()

        parsed_problems: Dict[str, Dict[str, Any]] = {}
        tag_names_by_id: Dict[str, List[str]] = {}

        for h2 in tag_headings:
            tag_name = h2.get_text(strip=True)
            ul = h2.find_next_sibling("ul")
            if not ul:
                continue

            for li in ul.find_all("li"):
                a = li.find("a")
                if not a:
                    continue
                text_val = a.get_text(strip=True)
                href = a.get("href", "")
                clean_text = text_val.replace("\U0001f512", "").strip()

                parts = clean_text.split(".", 1)
                if len(parts) == 2:
                    pid = parts[0].strip()
                    title = parts[1].strip()
                else:
                    pid = clean_text
                    title = clean_text

                if pid not in tag_names_by_id:
                    tag_names_by_id[pid] = []
                if tag_name not in tag_names_by_id[pid]:
                    tag_names_by_id[pid].append(tag_name)

                if pid not in parsed_problems:
                    meta = lc_meta.get(pid, {})
                    slug_val = meta.get("slug") or slugify(title)
                    difficulty = meta.get("difficulty") or "Unknown"
                    paid_only = meta.get("paid_only", "\U0001f512" in text_val)
                    leetcode_url = meta.get("leetcode_url") or (
                        f"https://leetcode.com/problems/{slug_val}/" if slug_val else ""
                    )
                    doocs_url = ""
                    if href:
                        doocs_url = f"https://leetcode.doocs.org/en/{href.lstrip('../')}"

                    parsed_problems[pid] = {
                        "id": pid,
                        "title": meta.get("title") or title,
                        "slug": slug_val,
                        "difficulty": difficulty,
                        "paid_only": paid_only,
                        "leetcode_url": leetcode_url,
                        "doocs_url": doocs_url,
                        "source": "doocs",
                    }

        logger.info(f"Parsed {len(parsed_problems)} unique problems across {len(tag_headings)} tags.")

        with get_db() as db:
            tag_id_map: Dict[str, int] = {}
            for h2 in tag_headings:
                name = h2.get_text(strip=True)
                tid = TagRepository.get_or_create_tag(db, name)
                tag_id_map[name] = tid

            for pid, prob in parsed_problems.items():
                stmt = pg_insert(Problem).values(
                    id=prob["id"],
                    title=prob["title"],
                    slug=prob["slug"],
                    difficulty=prob["difficulty"],
                    paid_only=1 if prob["paid_only"] else 0,
                    leetcode_url=prob["leetcode_url"],
                    doocs_url=prob["doocs_url"],
                    source=prob["source"],
                ).on_conflict_do_update(
                    index_elements=["id"],
                    set_=dict(
                        title=pg_insert(Problem).excluded.title,
                        slug=pg_insert(Problem).excluded.slug,
                        difficulty=pg_insert(Problem).excluded.difficulty,
                        paid_only=pg_insert(Problem).excluded.paid_only,
                        leetcode_url=pg_insert(Problem).excluded.leetcode_url,
                        doocs_url=pg_insert(Problem).excluded.doocs_url,
                    ),
                )
                db.execute(stmt)

                for tname in tag_names_by_id.get(pid, []):
                    tid = tag_id_map.get(tname)
                    if tid:
                        db.execute(
                            pg_insert(ProblemTag)
                            .values(problem_id=pid, tag_id=tid)
                            .on_conflict_do_nothing()
                        )

        logger.info("Successfully ingested all tags and problems into database!")
        return {
            "tags_count": len(tag_headings),
            "problems_count": len(parsed_problems),
            "k_shortest_paths_present": "2045" in parsed_problems,
        }


if __name__ == "__main__":
    ScraperService.scrape_and_seed()
