from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.auth.dependencies import get_current_user
from app.auth.protocol import User
from app.db.session import get_db
from app.models.tracking import StatsOut
from app.repositories.tracking_repo import TrackingRepository

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("", response_model=StatsOut)
def get_stats(
    tag: Optional[str] = Query(None, description="Tag slug for scoped stats"),
    user: User = Depends(get_current_user),
):
    """Get overall completion statistics and tag-scoped statistics."""
    with get_db() as db:
        stats = TrackingRepository.get_stats(db, user_id=user.id, tag_slug=tag)
        return StatsOut(**stats)
