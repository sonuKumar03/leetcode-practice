import urllib.request
import json
import logging
from typing import Dict, Any, List
from bs4 import BeautifulSoup
from app.config import DOOCS_TAGS_URL, LEETCODE_API_URL
from app.db.session import get_db_connection, init_db
from app.repositories.tag_repo import TagRepository, slugify

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScraperService:
    @staticmethod
    def fetch_leetcode_metadata() -> Dict[str, Dict[str, Any]]:
        """Fetch all problems from LeetCode official public API for difficulty and slugs."""
        logger.info(f"Fetching LeetCode metadata from {LEETCODE_API_URL}...")
        try:
            req = urllib.request.Request(
                LEETCODE_API_URL,
                headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            diff_map = {1: "Easy", 2: "Medium", 3: "Hard"}
            meta = {}
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
                        "leetcode_url": f"https://leetcode.com/problems/{slug}/" if slug else ""
                    }
            logger.info(f"Loaded {len(meta)} problems metadata from LeetCode API.")
            return meta
        except Exception as e:
            logger.warning(f"Could not fetch LeetCode API metadata ({e}). Will proceed with scraped titles.")
            return {}

    @staticmethod
    def scrape_and_seed() -> Dict[str, Any]:
        """Scrape all tags and problems from leetcode.doocs.org and ingest into SQLite."""
        init_db()
        logger.info(f"Scraping Doocs tags from {DOOCS_TAGS_URL}...")
        
        req = urllib.request.Request(
            DOOCS_TAGS_URL,
            headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"}
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
                text = a.get_text(strip=True)
                href = a.get("href", "")
                clean_text = text.replace("🔒", "").strip()

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
                    # Enrich from LeetCode meta if available
                    meta = lc_meta.get(pid, {})
                    slug = meta.get("slug") or slugify(title)
                    difficulty = meta.get("difficulty") or "Unknown"
                    paid_only = meta.get("paid_only", "🔒" in text)
                    leetcode_url = meta.get("leetcode_url") or (f"https://leetcode.com/problems/{slug}/" if slug else "")
                    
                    doocs_url = ""
                    if href:
                        doocs_url = f"https://leetcode.doocs.org/en/{href.lstrip('../')}"

                    parsed_problems[pid] = {
                        "id": pid,
                        "title": meta.get("title") or title,
                        "slug": slug,
                        "difficulty": difficulty,
                        "paid_only": paid_only,
                        "leetcode_url": leetcode_url,
                        "doocs_url": doocs_url,
                        "source": "doocs"
                    }

        logger.info(f"Parsed {len(parsed_problems)} unique problems across {len(tag_headings)} tags.")

        # Ingest into SQLite in one transaction
        with get_db_connection() as conn:
            # 1. Tags
            tag_id_map: Dict[str, int] = {}
            for h2 in tag_headings:
                name = h2.get_text(strip=True)
                tid = TagRepository.get_or_create_tag(conn, name)
                tag_id_map[name] = tid

            # 2. Problems
            for pid, prob in parsed_problems.items():
                conn.execute(
                    """
                    INSERT INTO problems (id, title, slug, difficulty, paid_only, leetcode_url, doocs_url, source)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        title = excluded.title,
                        slug = excluded.slug,
                        difficulty = excluded.difficulty,
                        paid_only = excluded.paid_only,
                        leetcode_url = excluded.leetcode_url,
                        doocs_url = excluded.doocs_url
                    """,
                    (
                        prob["id"],
                        prob["title"],
                        prob["slug"],
                        prob["difficulty"],
                        1 if prob["paid_only"] else 0,
                        prob["leetcode_url"],
                        prob["doocs_url"],
                        prob["source"]
                    )
                )

                # Link tags
                for tname in tag_names_by_id.get(pid, []):
                    tid = tag_id_map.get(tname)
                    if tid:
                        conn.execute(
                            "INSERT OR IGNORE INTO problem_tags (problem_id, tag_id) VALUES (?, ?)",
                            (pid, tid)
                        )

        logger.info("Successfully ingested all tags and problems into SQLite!")
        return {
            "tags_count": len(tag_headings),
            "problems_count": len(parsed_problems),
            "k_shortest_paths_present": "2045" in parsed_problems
        }

if __name__ == "__main__":
    ScraperService.scrape_and_seed()
