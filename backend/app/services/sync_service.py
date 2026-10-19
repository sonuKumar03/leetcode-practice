import threading
import time
import logging
from typing import List, Optional, Dict, Any, Callable
from contextlib import contextmanager
from app.adapters.registry import AdapterRegistry
from app.adapters.base import RawProblemItem
from app.repositories.problem_repo import ProblemRepository
from app.db.session import get_db_connection

logger = logging.getLogger(__name__)


class SyncPipelineService:
    _lock = threading.Lock()
    _current_status: Dict[str, Any] = {
        "status": "idle",
        "current_adapter": None,
        "progress_percent": 0,
        "last_result": None,
        "error": None,
    }

    def __init__(self, conn_factory: Optional[Callable] = None):
        self.conn_factory = conn_factory or get_db_connection

    @classmethod
    def is_running(cls) -> bool:
        return cls._current_status.get("status") == "running"

    @classmethod
    def get_sync_status(cls) -> Dict[str, Any]:
        return dict(cls._current_status)

    @contextmanager
    def _resolve_connection(self):
        cm_or_conn = self.conn_factory()
        if hasattr(cm_or_conn, "__enter__") and not hasattr(cm_or_conn, "cursor"):
            with cm_or_conn as conn:
                yield conn
        else:
            yield cm_or_conn

    @staticmethod
    def _aggregate(items) -> tuple:
        """Merge items sharing a slug; returns (aggregated dict, items seen)."""
        aggregated: Dict[str, RawProblemItem] = {}
        seen = 0
        for item in items:
            seen += 1
            curr = aggregated.get(item.slug)
            if curr is None:
                aggregated[item.slug] = RawProblemItem(
                    slug=item.slug,
                    leetcode_id=item.leetcode_id,
                    title=item.title,
                    difficulty=item.difficulty,
                    paid_only=item.paid_only,
                    topics=list(item.topics),
                    companies=list(item.companies),
                    curated_lists=list(item.curated_lists),
                    frequency_delta=item.frequency_delta,
                )
                continue
            curr.leetcode_id = item.leetcode_id or curr.leetcode_id
            curr.title = item.title or curr.title
            curr.difficulty = item.difficulty or curr.difficulty
            curr.paid_only = item.paid_only or curr.paid_only
            curr.topics = list(dict.fromkeys(curr.topics + item.topics))
            curr.companies = list(dict.fromkeys(curr.companies + item.companies))
            curr.curated_lists = list(dict.fromkeys(curr.curated_lists + item.curated_lists))
            curr.frequency_delta += item.frequency_delta
        return aggregated, seen

    def run_sync(self, adapter_names: Optional[List[str]] = None) -> Dict[str, Any]:
        if not SyncPipelineService._lock.acquire(blocking=False):
            return {"status": "error", "error": "A sync is already in progress"}
        try:
            return self._run_sync(adapter_names)
        finally:
            SyncPipelineService._lock.release()

    def _run_sync(self, adapter_names: Optional[List[str]]) -> Dict[str, Any]:
        SyncPipelineService._current_status = {
            "status": "running",
            "current_adapter": None,
            "progress_percent": 0,
            "last_result": None,
            "error": None,
        }

        start_time = time.time()
        all_adapters = AdapterRegistry.get_all()
        selected_names = adapter_names or [
            name for name, a in all_adapters.items() if a.enabled_by_default
        ]

        logger.info(f"Starting sync pipeline with adapters: {selected_names}")
        total_items_processed = 0
        total_upserted = 0
        total_tags = 0
        total_skipped = 0
        adapters_run: List[str] = []
        errors: Dict[str, str] = {}

        try:
            with self._resolve_connection() as conn:
                for idx, name in enumerate(selected_names):
                    adapter = all_adapters.get(name)
                    if not adapter:
                        logger.warning(f"Adapter '{name}' not found, skipping.")
                        continue

                    SyncPipelineService._current_status["current_adapter"] = name
                    SyncPipelineService._current_status["progress_percent"] = int(
                        (idx / len(selected_names)) * 100
                    )
                    logger.info(f"[{idx+1}/{len(selected_names)}] Running adapter '{name}'...")

                    # Each adapter is its own transaction: a failure rolls back only that
                    # adapter and the others still run.
                    try:
                        aggregated, seen = self._aggregate(adapter.fetch())
                        stats = ProblemRepository.batch_upsert_enriched_problems(
                            list(aggregated.values()), conn=conn, source=name
                        )
                        conn.commit()
                    except Exception as e:
                        conn.rollback()
                        logger.error(f"Adapter '{name}' failed: {e}", exc_info=True)
                        errors[name] = str(e)
                        continue

                    adapters_run.append(name)
                    total_items_processed += seen
                    total_upserted += stats.get("upserted_problems", 0)
                    total_tags += stats.get("tags_linked", 0)
                    total_skipped += stats.get("skipped_unknown_id", 0)

            duration = round(time.time() - start_time, 2)
            if errors and not adapters_run:
                status, error = "failed", "; ".join(f"{n}: {m}" for n, m in errors.items())
                result = {"status": "error", "error": error, "adapter_errors": errors}
            else:
                status = "completed"
                result = {
                    "status": "partial" if errors else "success",
                    "adapters_run": adapters_run,
                    "total_items_processed": total_items_processed,
                    "total_upserted_problems": total_upserted,
                    "total_tags_linked": total_tags,
                    "total_skipped_unknown_id": total_skipped,
                    "duration_seconds": duration,
                }
                if errors:
                    result["adapter_errors"] = errors

            SyncPipelineService._current_status = {
                "status": status,
                "current_adapter": None,
                "progress_percent": 100 if status == "completed" else 0,
                "last_result": result if status == "completed" else None,
                "error": result.get("error") or ("; ".join(f"{n}: {m}" for n, m in errors.items()) or None),
            }
            return result
        except Exception as e:
            logger.error(f"Sync pipeline failed: {e}", exc_info=True)
            SyncPipelineService._current_status = {
                "status": "failed",
                "current_adapter": None,
                "error": str(e),
                "progress_percent": 0,
                "last_result": None,
            }
            return {"status": "error", "error": str(e)}
