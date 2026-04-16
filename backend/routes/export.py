"""
Export endpoints:
  GET /api/tasks/{id}/export/csv        — all jobs as CSV
  GET /api/tasks/{id}/export/csv?...    — filtered jobs as CSV
  GET /api/tasks/{id}/export/jobs       — all jobs as JSON (for frontend PDF)
  GET /api/tasks/{id}/export/jobs?...   — filtered jobs as JSON (for frontend PDF)
"""

import csv
import io
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from backend.database import get_task, get_jobs, get_jobs_filtered

router = APIRouter()

_FILTER_PARAMS = dict(
    areas=Query(None),
    districts=Query(None),
    salary_min=Query(None),
    job_name=Query(None),
    company=Query(None),
    date_from=Query(None),
    date_to=Query(None),
    apply_min=Query(None),
    apply_max=Query(None),
    tags=Query(None),
    sort_by=Query("appear_date"),
    sort_dir=Query("desc"),
)

_EDU_MAP = {
    "1": "不拘",
    "2": "高中職以下",
    "3": "高中職",
    "4": "專科",
    "5": "大學",
    "6": "碩士",
    "7": "博士",
}

CSV_FIELDS = [
    "job_name", "company_name", "job_addr_no_desc", "job_address",
    "salary_low", "salary_high", "salary_desc",
    "appear_date", "apply_cnt", "option_edu", "period_desc", "tags", "job_url",
]

CSV_HEADERS = [
    "職缺名稱", "公司名稱", "地區", "詳細地址",
    "薪資下限", "薪資上限", "薪資說明",
    "刊登日", "應徵人數", "學歷要求", "工作性質", "標籤", "職缺連結",
]


def _resolve_jobs(task_id: str, filtered: bool, filter_kwargs: dict) -> list[dict]:
    """Return jobs list, either all or filtered (no pagination)."""
    if not filtered:
        return get_jobs(task_id)
    jobs, _ = get_jobs_filtered(
        task_id,
        page=1,
        page_size=99999,
        **filter_kwargs,
    )
    return jobs


def _parse_filter_kwargs(
    areas, districts, salary_min, job_name, company,
    date_from, date_to, apply_min, apply_max, tags, sort_by, sort_dir
) -> dict:
    return dict(
        areas=[a.strip() for a in areas.split(",") if a.strip()] if areas else None,
        districts=[d.strip() for d in districts.split(",") if d.strip()] if districts else None,
        salary_min=salary_min,
        job_name=job_name,
        company=company,
        date_from=date_from,
        date_to=date_to,
        apply_min=apply_min,
        apply_max=apply_max,
        tags=[t.strip() for t in tags.split(",") if t.strip()] if tags else None,
        sort_by=sort_by,
        sort_dir=sort_dir,
    )


def _translate_edu(raw: str) -> str:
    """Convert pipe-separated edu codes (e.g. '5|6') to Chinese labels."""
    if not raw:
        return ""
    parts = [_EDU_MAP.get(code.strip(), code.strip()) for code in raw.split("|") if code.strip()]
    return "、".join(parts)


def _jobs_to_csv(jobs: list[dict]) -> str:
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=CSV_FIELDS,
        extrasaction="ignore",
        lineterminator="\r\n",
    )
    writer.writerow(dict(zip(CSV_FIELDS, CSV_HEADERS)))
    for job in jobs:
        row = {f: job.get(f, "") or "" for f in CSV_FIELDS}
        row["option_edu"] = _translate_edu(str(row["option_edu"]))
        writer.writerow(row)
    return "\ufeff" + output.getvalue()  # UTF-8 BOM for Excel


def _check_task_done(task_id: str):
    task = get_task(task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="Task not found")
    if task["status"] not in ("done", "cancelled"):
        raise HTTPException(status_code=202, detail=f"Task is still {task['status']}")
    return task


# ---------------------------------------------------------------------------
# CSV endpoints
# ---------------------------------------------------------------------------

@router.get("/tasks/{task_id}/export/csv")
async def export_csv(
    task_id: str,
    filtered: bool = Query(False, description="True = apply filter params"),
    areas: Optional[str] = Query(None),
    districts: Optional[str] = Query(None),
    salary_min: Optional[int] = Query(None),
    job_name: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    apply_min: Optional[int] = Query(None),
    apply_max: Optional[int] = Query(None),
    tags: Optional[str] = Query(None),
    sort_by: str = Query("appear_date"),
    sort_dir: str = Query("desc"),
):
    _check_task_done(task_id)
    kwargs = _parse_filter_kwargs(
        areas, districts, salary_min, job_name, company,
        date_from, date_to, apply_min, apply_max, tags, sort_by, sort_dir,
    )
    jobs = _resolve_jobs(task_id, filtered, kwargs)
    csv_content = _jobs_to_csv(jobs)
    suffix = "filtered" if filtered else "all"
    filename = f"jobinsight_{task_id[:8]}_{suffix}.csv"
    return StreamingResponse(
        iter([csv_content.encode("utf-8-sig")]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ---------------------------------------------------------------------------
# Jobs JSON endpoint (for frontend PDF generation)
# ---------------------------------------------------------------------------

@router.get("/tasks/{task_id}/export/jobs")
async def export_jobs_json(
    task_id: str,
    filtered: bool = Query(False),
    areas: Optional[str] = Query(None),
    districts: Optional[str] = Query(None),
    salary_min: Optional[int] = Query(None),
    job_name: Optional[str] = Query(None),
    company: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    apply_min: Optional[int] = Query(None),
    apply_max: Optional[int] = Query(None),
    tags: Optional[str] = Query(None),
    sort_by: str = Query("appear_date"),
    sort_dir: str = Query("desc"),
):
    """Return all jobs (no pagination) for frontend PDF generation."""
    _check_task_done(task_id)
    kwargs = _parse_filter_kwargs(
        areas, districts, salary_min, job_name, company,
        date_from, date_to, apply_min, apply_max, tags, sort_by, sort_dir,
    )
    jobs = _resolve_jobs(task_id, filtered, kwargs)
    return {"jobs": jobs, "total": len(jobs), "filtered": filtered}
