from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional, Iterable


@dataclass
class RawProblemItem:
    slug: str
    leetcode_id: Optional[str] = None
    title: Optional[str] = None
    difficulty: Optional[str] = None
    paid_only: bool = False
    topics: List[str] = field(default_factory=list)
    companies: List[str] = field(default_factory=list)
    curated_lists: List[str] = field(default_factory=list)
    frequency_delta: int = 1


class BaseSourceAdapter(ABC):
    name: str = "base"
    description: str = ""
    enabled_by_default: bool = True

    @abstractmethod
    def fetch(self) -> Iterable[RawProblemItem]:
        """Fetch external data and yield normalized RawProblemItem instances."""
        pass
