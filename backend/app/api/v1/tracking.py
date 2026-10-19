from fastapi import APIRouter, Depends, HTTPException
from app.auth.dependencies import get_current_user
from app.auth.protocol import User
from app.db.session import get_db_connection
from app.models.tracking import TrackingUpdate, TrackingOut, BatchTrackingRequest, BatchTrackingOut
from app.repositories.tracking_repo import TrackingRepository
from app.repositories.problem_repo import ProblemRepository

router = APIRouter(prefix="/problems", tags=["tracking"])

@router.patch("/{problem_id}/tracking", response_model=TrackingOut)
def update_problem_tracking(
    problem_id: str,
    payload: TrackingUpdate,
    user: User = Depends(get_current_user),
):
    """Update status (todo/in_progress/solved), star bookmark, or personal notes."""
    with get_db_connection() as conn:
        prob = ProblemRepository.get_by_id(conn, problem_id, user_id=user.id)
        if not prob:
            raise HTTPException(status_code=404, detail="Problem not found")

        updated = TrackingRepository.upsert_tracking(
            conn=conn,
            user_id=user.id,
            problem_id=problem_id,
            status=payload.status,
            is_starred=payload.is_starred,
            notes=payload.notes,
        )
        return TrackingOut(
            problem_id=updated["problem_id"],
            status=updated["status"],
            is_starred=bool(updated["is_starred"]),
            notes=updated["notes"] or "",
            updated_at=str(updated["updated_at"]) if updated["updated_at"] else None,
        )


@router.put("/tracking/batch", response_model=BatchTrackingOut)
def batch_update_tracking(
    payload: BatchTrackingRequest,
    user: User = Depends(get_current_user),
):
    """Batch update tracking for multiple problems in a single transaction."""
    with get_db_connection() as conn:
        count = 0
        for item in payload.items:
            TrackingRepository.upsert_tracking(
                conn=conn,
                user_id=user.id,
                problem_id=item.id,
                status=item.status,
                is_starred=item.is_starred,
                notes=item.notes,
            )
            count += 1
        return BatchTrackingOut(updated=count)

