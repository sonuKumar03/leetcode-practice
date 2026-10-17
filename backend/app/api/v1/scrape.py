from fastapi import APIRouter, BackgroundTasks
from app.services.scraper_service import ScraperService

router = APIRouter(prefix="/scrape", tags=["scraper"])

@router.post("")
def trigger_scraper(background_tasks: BackgroundTasks):
    """Trigger background scraping of leetcode.doocs.org and LeetCode API to refresh questions."""
    background_tasks.add_task(ScraperService.scrape_and_seed)
    return {"message": "Scraping started in background"}
