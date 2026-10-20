from typing import Optional

from app.auth.dependencies import get_current_user
from app.auth.protocol import User
from app.db.session import get_db
from app.models.problem import (
    MetadataLookupOut,
    ProblemCreate,
    ProblemListResponse,
    ProblemOut,
)
from app.repositories.problem_repo import ProblemRepository
from app.services.metadata_service import MetadataService
from fastapi import APIRouter, Depends, HTTPException, Query

router = APIRouter(prefix="/problems", tags=["problems"])


@router.get("", response_model=ProblemListResponse)
def get_problems(
    tag: Optional[str] = Query(
        None, description="Tag slug or name (e.g. k-shortest-paths)"
    ),
    difficulty: Optional[str] = Query(None, description="Easy, Medium, Hard, or All"),
    status: Optional[str] = Query(
        None, description="todo, in_progress, solved, or All"
    ),
    search: Optional[str] = Query(None, description="Search by ID or Title"),
    search_notes: bool = Query(False, description="Also search within notes"),
    is_starred: Optional[bool] = Query(
        None, description="Filter only starred/bookmarked"
    ),
    paid_only: Optional[bool] = Query(None, description="Filter premium questions"),
    sort_by: str = Query(
        "id_asc",
        description="id_asc, id_desc, title_asc, title_desc, difficulty_asc, difficulty_desc, frequency_desc, status_asc",
    ),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: User = Depends(get_current_user),
):
    with get_db() as db:
        items, total = ProblemRepository.list_problems(
            db=db,
            user_id=user.id,
            tag=tag,
            difficulty=difficulty,
            status=status,
            search=search,
            search_notes=search_notes,
            is_starred=is_starred,
            paid_only=paid_only,
            page=page,
            page_size=page_size,
            sort_by=sort_by,
        )
        total_pages = (total + page_size - 1) // page_size if total > 0 else 1
        return ProblemListResponse(
            items=[ProblemOut(**p) for p in items],
            total=total,
            page=page,
            page_size=page_size,
            total_pages=total_pages,
        )


@router.get("/lookup", response_model=MetadataLookupOut)
def lookup_metadata(
    query: str = Query(..., description="Problem ID, Title slug, or LeetCode URL"),
):
    """Auto-fill metadata (title, difficulty, url, algorithm tags, company tags) for a problem."""
    result = MetadataService.lookup_metadata(query)
    if not result:
        raise HTTPException(status_code=404, detail="No metadata found for query")
    return MetadataLookupOut(**result)


@router.get("/{problem_id}", response_model=ProblemOut)
def get_problem(problem_id: str, user: User = Depends(get_current_user)):
    with get_db() as db:
        problem = ProblemRepository.get_by_id(db, problem_id, user_id=user.id)
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")
        return ProblemOut(**problem)


@router.post("", response_model=ProblemOut, status_code=201)
def add_problem(payload: ProblemCreate, user: User = Depends(get_current_user)):
    """Add a new question (custom or LeetCode) to the database."""
    with get_db() as db:
        created = ProblemRepository.create_problem(
            db=db,
            problem_id=payload.id,
            title=payload.title,
            difficulty=payload.difficulty,
            tags=payload.tags,
            company_tags=payload.company_tags,
            leetcode_url=payload.leetcode_url,
            doocs_url=payload.doocs_url,
            notes=payload.notes,
            source="custom",
            user_id=user.id,
        )
        return ProblemOut(**created)
