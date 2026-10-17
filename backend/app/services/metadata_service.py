import re
import urllib.request
import json
import logging
import sqlite3
from typing import Dict, Any, Optional, List
from bs4 import BeautifulSoup
from app.config import LEETCODE_API_URL
from app.db.session import get_db_connection

logger = logging.getLogger(__name__)

class MetadataService:
    _lc_cache: Optional[Dict[str, Any]] = None

    @classmethod
    def _get_leetcode_all_cache(cls) -> Dict[str, Any]:
        """Fetch and cache LeetCode official problem list in-memory."""
        if cls._lc_cache is not None:
            return cls._lc_cache

        logger.info("Fetching LeetCode problem catalog for autofill...")
        try:
            req = urllib.request.Request(
                LEETCODE_API_URL,
                headers={"User-Agent": "Mozilla/5.0"}
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            diff_map = {1: "Easy", 2: "Medium", 3: "Hard"}
            by_id = {}
            by_slug = {}

            for item in data.get("stat_status_pairs", []):
                stat = item.get("stat", {})
                fid = str(stat.get("frontend_question_id", ""))
                slug = stat.get("question__title_slug", "")
                title = stat.get("question__title", "")
                level = item.get("difficulty", {}).get("level", 0)

                record = {
                    "id": fid,
                    "title": title,
                    "slug": slug,
                    "difficulty": diff_map.get(level, "Medium"),
                    "leetcode_url": f"https://leetcode.com/problems/{slug}/" if slug else "",
                }
                if fid:
                    by_id[fid] = record
                if slug:
                    by_slug[slug] = record

            cls._lc_cache = {"by_id": by_id, "by_slug": by_slug}
            return cls._lc_cache
        except Exception as e:
            logger.warning(f"Failed to fetch LeetCode cache: {e}")
            return {"by_id": {}, "by_slug": {}}

    @staticmethod
    def _fetch_doocs_tags(problem_id: str) -> List[str]:
        """Fetch algorithm tags from Doocs wiki page if available."""
        if not problem_id.isdigit():
            return []
        try:
            url = f"https://leetcode.doocs.org/en/lc/{problem_id}/"
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=4) as resp:
                soup = BeautifulSoup(resp.read().decode("utf-8", errors="ignore"), "html.parser")
            
            raw_tags = [
                a.get_text(strip=True)
                for a in soup.find_all("a", href=lambda x: x and "/tags/" in x)
            ]
            # Exclude non-topic tags
            exclude = {"focused training", "leetcode", "tags"}
            clean_tags = [t for t in raw_tags if t.lower() not in exclude]
            # Deduplicate maintaining order
            seen = set()
            out = []
            for t in clean_tags:
                if t not in seen:
                    seen.add(t)
                    out.append(t)
            return out
        except Exception:
            return []

    @classmethod
    def lookup_metadata(cls, query: str) -> Optional[Dict[str, Any]]:
        clean_q = query.strip()
        if not clean_q:
            return None

        # Check if URL
        url_match = re.search(r'leetcode\.com/problems/([^/?#]+)', clean_q)
        target_slug = url_match.group(1) if url_match else None
        target_id = clean_q if clean_q.isdigit() else None
        if not target_id and not target_slug:
            target_slug = clean_q.lower()

        # Step 1: Check local SQLite database first
        with get_db_connection() as conn:
            if target_id:
                row = conn.execute(
                    "SELECT id, title, slug, difficulty, leetcode_url FROM problems WHERE id = ?",
                    (target_id,)
                ).fetchone()
            else:
                row = conn.execute(
                    "SELECT id, title, slug, difficulty, leetcode_url FROM problems WHERE slug = ? OR LOWER(title) = ?",
                    (target_slug, target_slug)
                ).fetchone()

            if row:
                pid = row["id"]
                # Fetch topic tags & company tags
                tag_rows = conn.execute(
                    """
                    SELECT t.name, COALESCE(t.type, 'topic') as type
                    FROM problem_tags pt
                    JOIN tags t ON pt.tag_id = t.id
                    WHERE pt.problem_id = ?
                    ORDER BY t.name ASC
                    """,
                    (pid,)
                ).fetchall()

                topic_tags = [r["name"] for r in tag_rows if r["type"] != "company"]
                company_tags = [r["name"] for r in tag_rows if r["type"] == "company"]

                return {
                    "id": row["id"],
                    "title": row["title"],
                    "difficulty": row["difficulty"] if row["difficulty"] != "Unknown" else "Medium",
                    "leetcode_url": row["leetcode_url"] or f"https://leetcode.com/problems/{row['slug']}/",
                    "tags": topic_tags,
                    "company_tags": company_tags,
                    "source": "database",
                }

        # Step 2: Fallback to LeetCode official catalog
        lc_cache = cls._get_leetcode_all_cache()
        lc_record = None
        if target_id and target_id in lc_cache.get("by_id", {}):
            lc_record = lc_cache["by_id"][target_id]
        elif target_slug and target_slug in lc_cache.get("by_slug", {}):
            lc_record = lc_cache["by_slug"][target_slug]

        if lc_record:
            pid = lc_record["id"]
            # Scrape algorithm tags from Doocs Wiki
            tags = cls._fetch_doocs_tags(pid)

            # Check if any companies matched in local DB
            company_tags = []
            with get_db_connection() as conn:
                tag_rows = conn.execute(
                    """
                    SELECT t.name
                    FROM problem_tags pt
                    JOIN tags t ON pt.tag_id = t.id
                    WHERE pt.problem_id = ? AND t.type = 'company'
                    ORDER BY t.name ASC
                    """,
                    (pid,)
                ).fetchall()
                company_tags = [r["name"] for r in tag_rows]

            return {
                "id": pid,
                "title": lc_record["title"],
                "difficulty": lc_record["difficulty"],
                "leetcode_url": lc_record["leetcode_url"],
                "tags": tags,
                "company_tags": company_tags,
                "source": "leetcode_catalog",
            }

        return None
