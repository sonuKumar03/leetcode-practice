import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

DATABASE_PATH = Path(os.getenv("DATABASE_PATH", str(DATA_DIR / "leetcode.db")))
SCHEMA_PATH = Path(__file__).resolve().parent / "db" / "schema.sql"

DOOCS_TAGS_URL = "https://leetcode.doocs.org/en/tags/"
LEETCODE_API_URL = "https://leetcode.com/api/problems/all/"

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-dev-key-change-in-production")
JWT_EXPIRY_DAYS = int(os.getenv("JWT_EXPIRY_DAYS", "7"))
