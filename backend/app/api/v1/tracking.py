from fastapi import APIRouter, HTTPException
from app.db.session import get_db_connection
from app.models.tracking import TrackingUpdate, TrackingOut
from app.repositories.tracking_repo import TrackingRepository
from app.repositories.problem_repo import ProblemRepository

router = APIRouter(prefix="/problems", tags=["tracking"])

@router.patch("/{problem_id}/tracking", response_model=TrackingOut)
def update_problem_tracking(problem_id: str, payload: TrackingUpdate):
    """Update status (todo/in_progress/solved), star bookmark, or personal notes."""
    with get_db_connection() as conn:
        prob = ProblemRepository.get_by_id(conn, problem_id)
        if not prob:
            raise HTTPException(status_code=404, detail="Problem not found")

        updated = TrackingRepository.upsert_tracking(
            conn=conn,
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
