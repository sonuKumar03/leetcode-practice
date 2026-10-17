from pydantic import BaseModel

class TagOut(BaseModel):
    id: int
    name: str
    slug: str
    type: str = "topic"
    problem_count: int = 0
