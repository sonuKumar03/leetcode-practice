from fastapi import APIRouter
from app.api.v1 import problems, tracking, tags, stats, scrape

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(problems.router)
api_router.include_router(tracking.router)
api_router.include_router(tags.router)
api_router.include_router(stats.router)
api_router.include_router(scrape.router)
