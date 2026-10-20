from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.auth.dependencies import get_current_user
from app.auth.protocol import User
from app.db.session import get_db
from app.models.tag import TagOut
from app.repositories.tag_repo import TagRepository

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("", response_model=List[TagOut])
def get_tags(
    user: User = Depends(get_current_user),
    type: Optional[str] = Query(None, description="Filter tags by type: 'topic', 'company' or 'list'"),
    status: Optional[str] = Query(None, description="Filter counts by status: 'todo', 'in_progress', 'solved'"),
):
    """List all algorithm and company tags with problem counts."""
    with get_db() as db:
        tags = TagRepository.list_tags(db, user_id=user.id, tag_type=type, status=status)
        return [TagOut(**t) for t in tags]
