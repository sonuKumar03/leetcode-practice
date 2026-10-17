from typing import Optional
from fastapi import APIRouter, Query
from app.db.session import get_db_connection
from app.models.tracking import StatsOut
from app.repositories.tracking_repo import TrackingRepository

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("", response_model=StatsOut)
def get_stats(tag: Optional[str] = Query(None, description="Tag slug for scoped stats")):
    """Get overall completion statistics and tag-scoped statistics."""
    with get_db_connection() as conn:
        stats = TrackingRepository.get_stats(conn, tag_slug=tag)
        return StatsOut(**stats)
