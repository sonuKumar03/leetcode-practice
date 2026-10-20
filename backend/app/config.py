import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/leetcode")
SEED_DB_PATH = DATA_DIR / "leetcode.db"

DOOCS_TAGS_URL = "https://leetcode.doocs.org/en/tags/"
LEETCODE_API_URL = "https://leetcode.com/api/problems/all/"
