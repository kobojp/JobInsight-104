"""GET /api/tasks/{task_id} — poll status and fetch results."""

import json
from typing import Optional
from fastapi import APIRouter, HTTPException, Query

from pydantic import BaseModel
from backend.database import get_task, list_tasks, get_jobs, get_jobs_filtered, get_filter_options, delete_tasks
from backend.services.scraper_service import get_progress, compute_stats, request_stop

router = APIRouter()


@router.get("/tasks/{task_id}")
async def task_status(task_id: str):
    """Poll task status and live progress."""
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")

    # Merge in-memory progress (available while thread is running)
    prog = get_progress(task_id)

    return {
        "task_id": task["task_id"],
        "status": task["status"],
        "created_at": task["created_at"],
        "completed_at": task.get("completed_at"),
        "total_jobs": task.get("total_jobs", 0),
        "error": task.get("error"),
        "params": json.loads(task["params"]) if task.get("params") else {},
        "progress": {
            "current_page": prog.get("current_page", 0),
            "total_pages": prog.get("total_pages", 0),
            "collected": prog.get("collected", 0),
            "total": prog.get("total", 0),
        },
    }


@router.get("/tasks/{task_id}/results")
async def task_results(
    task_id: str,
    page: int = 1,
    page_size: int = 50,
    # Filter params
    areas: Optional[str] = Query(None, description="縣市，逗號分隔"),
    districts: Optional[str] = Query(None, description="區，逗號分隔"),
    salary_min: Optional[int] = Query(None),
    job_name: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    apply_min: Optional[int] = Query(None),
    apply_max: Optional[int] = Query(None),
    tags: Optional[str] = Query(None, description="tags，逗號分隔"),
    sort_by: str = Query("appear_date"),
    sort_dir: str = Query("desc"),
):
    """Fetch paginated job results with optional filters and aggregated stats."""
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task["status"] != "done":
        raise HTTPException(
            status_code=202,
            detail=f"Task is still {task['status']}",
        )

    has_filter = any([areas, districts, salary_min is not None, job_name,
                      company, date_from, date_to,
                      apply_min is not None, apply_max is not None, tags])

    areas_list = [a.strip() for a in areas.split(",") if a.strip()] if areas else None
    districts_list = [d.strip() for d in districts.split(",") if d.strip()] if districts else None
    tags_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else None

    paginated, total = get_jobs_filtered(
        task_id,
        areas=areas_list,
        districts=districts_list,
        salary_min=salary_min,
        job_name=job_name,
        company=company,
        date_from=date_from,
        date_to=date_to,
        apply_min=apply_min,
        apply_max=apply_max,
        tags=tags_list,
        sort_by=sort_by,
        sort_dir=sort_dir,
        page=page,
        page_size=page_size,
    )

    # Stats always computed on full unfiltered dataset
    all_jobs = get_jobs(task_id)
    stats = compute_stats(all_jobs)

    # filter_options only on first load (no filter active)
    filter_options = None
    if not has_filter and page == 1:
        filter_options = get_filter_options(task_id)

    return {
        "task_id": task_id,
        "total": total,
        "page": page,
        "page_size": page_size,
        "jobs": paginated,
        "stats": stats,
        "filter_options": filter_options,
    }


@router.post("/tasks/{task_id}/cancel")
async def cancel_task(task_id: str):
    """Request the scraping thread to stop after the current page."""
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task["status"] not in ("pending", "running"):
        raise HTTPException(status_code=400, detail=f"Task is already {task['status']}")
    request_stop(task_id)
    return {"task_id": task_id, "message": "Stop requested"}


@router.get("/history")
async def search_history(limit: int = 20):
    """List recent search tasks. limit=0 returns all."""
    return {"history": list_tasks(limit if limit > 0 else 999999)}


class DeleteTasksRequest(BaseModel):
    task_ids: list[str]


@router.delete("/tasks")
async def delete_tasks_endpoint(req: DeleteTasksRequest):
    """Delete multiple tasks and their job data."""
    if not req.task_ids:
        raise HTTPException(status_code=400, detail="No task_ids provided")
    deleted = delete_tasks(req.task_ids)
    return {"deleted": deleted, "task_ids": req.task_ids}
