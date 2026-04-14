"""POST /api/search — start a scrape task."""

import json
import threading
import uuid
from datetime import datetime

from fastapi import APIRouter, HTTPException

from backend.database import DB_PATH, create_task
from backend.models import SearchRequest
from backend.services.scraper_service import scrape_in_thread

router = APIRouter()


@router.post("/search")
async def start_search(req: SearchRequest):
    """
    Start a background scrape task.
    Returns task_id immediately; client should poll /api/tasks/{task_id}.
    """
    task_id = str(uuid.uuid4())
    created_at = datetime.now().isoformat()
    params = req.model_dump()

    create_task(task_id, params, created_at)

    thread = threading.Thread(
        target=scrape_in_thread,
        args=(task_id, params, params.get("max_pages"), str(DB_PATH)),
        daemon=True,
    )
    thread.start()

    return {"task_id": task_id, "status": "pending", "created_at": created_at}
