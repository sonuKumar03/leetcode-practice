from datetime import datetime
from typing import Optional, Literal, Union
from pydantic import BaseModel

StatusType = Literal["todo", "in_progress", "solved"]

class TrackingUpdate(BaseModel):
    status: Optional[StatusType] = None
    is_starred: Optional[bool] = None
    notes: Optional[str] = None

class TrackingOut(BaseModel):
    problem_id: str
    status: StatusType = "todo"
    is_starred: bool = False
    notes: str = ""
    updated_at: Optional[Union[str, datetime]] = None

class BatchTrackingItem(BaseModel):
    id: str
    status: Optional[StatusType] = None
    is_starred: Optional[bool] = None
    notes: Optional[str] = None

class BatchTrackingRequest(BaseModel):
    items: list[BatchTrackingItem]

class BatchTrackingOut(BaseModel):
    updated: int

class StatsOut(BaseModel):
    total_problems: int
    solved_problems: int
    in_progress_problems: int
    todo_problems: int
    starred_problems: int
    completion_percentage: float
    easy_total: int
    easy_solved: int
    medium_total: int
    medium_solved: int
    hard_total: int
    hard_solved: int
    current_streak: int = 0
    tag_name: Optional[str] = None
    tag_total: Optional[int] = None
    tag_solved: Optional[int] = None
