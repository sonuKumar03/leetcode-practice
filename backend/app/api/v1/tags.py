from typing import List
from fastapi import APIRouter
from app.db.session import get_db_connection
from app.models.tag import TagOut
from app.repositories.tag_repo import TagRepository

router = APIRouter(prefix="/tags", tags=["tags"])

@router.get("", response_model=List[TagOut])
def get_tags():
    """List all algorithm tags with problem counts, sorted with focus tags first."""
    with get_db_connection() as conn:
        tags = TagRepository.list_tags(conn)
        return [TagOut(**t) for t in tags]
