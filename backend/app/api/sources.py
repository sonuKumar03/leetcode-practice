import os
import secrets
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel

from app.adapters import load_all_adapters
from app.adapters.registry import AdapterRegistry
from app.services.sync_service import SyncPipelineService

load_all_adapters()

router = APIRouter(prefix="/sources", tags=["sources"])


class SyncRequest(BaseModel):
    adapters: Optional[List[str]] = None


def _require_sync_token(x_api_key: Optional[str]) -> None:
    """If SYNC_API_TOKEN is set, triggering a sync requires a matching X-API-Key header."""
    expected = os.environ.get("SYNC_API_TOKEN")
    if expected and not secrets.compare_digest(x_api_key or "", expected):
        raise HTTPException(status_code=401, detail="Invalid or missing X-API-Key")


@router.get("")
def list_sources():
    """List all registered external source adapters."""
    return {"adapters": AdapterRegistry.list_metadata()}


@router.get("/sync/status")
def get_sync_status():
    """Get current or last synchronization job status."""
    return SyncPipelineService.get_sync_status()


@router.post("/sync")
def trigger_sync(
    background_tasks: BackgroundTasks,
    payload: Optional[SyncRequest] = None,
    x_api_key: Optional[str] = Header(None),
):
    """Trigger background synchronization of external source adapters."""
    _require_sync_token(x_api_key)
    adapters = payload.adapters if payload else None
    unknown = [a for a in (adapters or []) if a not in AdapterRegistry._registry]
    if unknown:
        raise HTTPException(status_code=422, detail=f"Unknown adapters: {unknown}")
    if SyncPipelineService.is_running():
        raise HTTPException(status_code=409, detail="A sync is already in progress")
    background_tasks.add_task(SyncPipelineService().run_sync, adapters)
    return {"status": "started", "message": "Source synchronization initiated in background."}
