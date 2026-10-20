import json
import logging
import re
import urllib.request
from typing import Any, Dict, List, Optional

from bs4 import BeautifulSoup
from sqlalchemy import func, select

from app.config import LEETCODE_API_URL
from app.db.models import Problem, ProblemTag, Tag
from app.db.session import get_db

logger = logging.getLogger(__name__)


class MetadataService:
    _lc_cache: Optional[Dict[str, Any]] = None

    @classmethod
    def _get_leetcode_all_cache(cls) -> Dict[str, Any]:
        if cls._lc_cache is not None:
            return cls._lc_cache

        logger.info("Fetching LeetCode problem catalog for autofill...")
        try:
            req = urllib.request.Request(
                LEETCODE_API_URL,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))

            diff_map = {1: "Easy", 2: "Medium", 3: "Hard"}
            by_id: Dict[str, Any] = {}
            by_slug: Dict[str, Any] = {}

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
            exclude = {"focused training", "leetcode", "tags"}
            seen: set = set()
            out: List[str] = []
            for t in raw_tags:
                if t.lower() not in exclude and t not in seen:
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

        url_match = re.search(r"leetcode\.com/problems/([^/?#]+)", clean_q)
        target_slug = url_match.group(1) if url_match else None
        target_id = clean_q if clean_q.isdigit() else None
        if not target_id and not target_slug:
            target_slug = clean_q.lower()

        with get_db() as db:
            if target_id:
                row = db.execute(
                    select(Problem.id, Problem.title, Problem.slug, Problem.difficulty, Problem.leetcode_url)
                    .where(Problem.id == target_id)
                ).mappings().first()
            else:
                row = db.execute(
                    select(Problem.id, Problem.title, Problem.slug, Problem.difficulty, Problem.leetcode_url)
                    .where((Problem.slug == target_slug) | (func.lower(Problem.title) == target_slug))
                ).mappings().first()

            if row:
                pid = row["id"]
                tag_rows = db.execute(
                    select(Tag.name, func.coalesce(Tag.type, "topic").label("type"))
                    .join(ProblemTag, ProblemTag.tag_id == Tag.id)
                    .where(ProblemTag.problem_id == pid)
                    .order_by(Tag.name.asc())
                ).mappings().all()

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

        lc_cache = cls._get_leetcode_all_cache()
        lc_record = None
        if target_id and target_id in lc_cache.get("by_id", {}):
            lc_record = lc_cache["by_id"][target_id]
        elif target_slug and target_slug in lc_cache.get("by_slug", {}):
            lc_record = lc_cache["by_slug"][target_slug]

        if lc_record:
            pid = lc_record["id"]
            tags = cls._fetch_doocs_tags(pid)

            company_tags = []
            with get_db() as db:
                tag_rows = db.execute(
                    select(Tag.name)
                    .join(ProblemTag, ProblemTag.tag_id == Tag.id)
                    .where(ProblemTag.problem_id == pid, Tag.type == "company")
                    .order_by(Tag.name.asc())
                ).scalars().all()
                company_tags = list(tag_rows)

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
