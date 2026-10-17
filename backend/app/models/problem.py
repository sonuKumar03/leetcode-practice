from typing import List, Optional, Literal
from pydantic import BaseModel, Field

DifficultyType = Literal["Easy", "Medium", "Hard", "Unknown"]
StatusType = Literal["todo", "in_progress", "solved"]

class ProblemBase(BaseModel):
    id: str
    title: str
    slug: Optional[str] = None
    difficulty: DifficultyType = "Unknown"
    paid_only: bool = False
    leetcode_url: Optional[str] = None
    doocs_url: Optional[str] = None
    source: str = "doocs"

class ProblemCreate(BaseModel):
    id: str = Field(..., description="Problem ID or number (e.g. 2045 or custom-1)")
    title: str = Field(..., description="Problem title")
    difficulty: DifficultyType = "Medium"
    tags: List[str] = Field(default_factory=list, description="List of algorithm topic tags")
    company_tags: List[str] = Field(default_factory=list, description="List of company tags")
    leetcode_url: Optional[str] = None
    doocs_url: Optional[str] = None
    notes: Optional[str] = None

class ProblemOut(ProblemBase):
    tags: List[str] = []
    status: StatusType = "todo"
    is_starred: bool = False
    notes: str = ""
    updated_at: Optional[str] = None

class ProblemListResponse(BaseModel):
    items: List[ProblemOut]
    total: int
    page: int
    page_size: int
    total_pages: int

class MetadataLookupOut(BaseModel):
    id: str
    title: str
    difficulty: str = "Medium"
    leetcode_url: str = ""
    tags: List[str] = []
    company_tags: List[str] = []
    source: str = "database"
