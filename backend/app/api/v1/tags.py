from typing import List, Optional
from fastapi import APIRouter, Query
from app.db.session import get_db_connection
from app.models.tag import TagOut
from app.repositories.tag_repo import TagRepository

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("", response_model=List[TagOut])
def get_tags(
    type: Optional[str] = Query(None, description="Filter tags by type: 'topic', 'company' or 'list'"),
    status: Optional[str] = Query(None, description="Filter counts by status: 'todo', 'in_progress', 'solved'"),
):
    """List all algorithm and company tags with problem counts."""
    with get_db_connection() as conn:
        tags = TagRepository.list_tags(conn, tag_type=type, status=status)
        return [TagOut(**t) for t in tags]
