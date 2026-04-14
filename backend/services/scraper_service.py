"""
Wraps the existing scraper to run in a background thread with progress tracking.
Imports config and scraper from the project root (one level up from backend/).
"""

import json
import sqlite3
import threading
from datetime import datetime
from typing import Optional

import pandas as pd

import config as app_config
from scraper.client import JobClient
from scraper import parser

# In-memory progress dict keyed by task_id.
# Used by background threads to report live progress to the API.
_progress: dict[str, dict] = {}
_progress_lock = threading.Lock()

# Stop flags: task_id -> threading.Event
_stop_flags: dict[str, threading.Event] = {}
_stop_lock = threading.Lock()


def get_progress(task_id: str) -> dict:
    with _progress_lock:
        return dict(_progress.get(task_id, {}))


def _set_progress(task_id: str, **kwargs):
    with _progress_lock:
        _progress.setdefault(task_id, {}).update(kwargs)


def request_stop(task_id: str) -> None:
    """Signal the scraping thread to stop after the current page."""
    with _stop_lock:
        flag = _stop_flags.get(task_id)
        if flag:
            flag.set()


def _should_stop(task_id: str) -> bool:
    with _stop_lock:
        flag = _stop_flags.get(task_id)
        return flag.is_set() if flag else False


def _register_task(task_id: str) -> None:
    with _stop_lock:
        _stop_flags[task_id] = threading.Event()


def _cleanup_task(task_id: str) -> None:
    with _stop_lock:
        _stop_flags.pop(task_id, None)


def build_api_params(search_params: dict) -> dict:
    """Convert frontend SearchRequest fields to 104 API query params."""
    # Resolve area names → area codes
    area_str = search_params.get("area", "taipei")
    areas = [a.strip() for a in area_str.split(",") if a.strip()]
    area_codes = [
        app_config.AREA_CODES.get(a, a)  # fallback: treat as raw code
        for a in areas
    ]

    order_code = app_config.ORDER_CODES.get(
        search_params.get("order", "relevance"), "15"
    )

    params = {
        **app_config.DEFAULT_PARAMS,
        "area": ",".join(area_codes),
        "order": order_code,
        "pagesize": str(search_params.get("pagesize", 20)),
    }

    keyword = search_params.get("keyword", "")
    if keyword:
        params["keyword"] = keyword

    # Optional pass-through filters
    for key in ("ro", "s5"):
        val = search_params.get(key)
        if val is not None:
            params[key] = str(val)

    if search_params.get("salary_from"):
        params["salaryFrom"] = str(search_params["salary_from"])
    if search_params.get("salary_to"):
        params["salaryTo"] = str(search_params["salary_to"])

    return params


def scrape_in_thread(
    task_id: str,
    search_params: dict,
    max_pages: Optional[int],
    db_path: str,
) -> None:
    """
    Target function for background threads.
    Updates SQLite and in-memory progress during scraping.
    """
    _register_task(task_id)
    _set_progress(task_id, status="running", current_page=0,
                  total_pages=0, collected=0, total=0, cancelled=False)

    conn = sqlite3.connect(db_path)
    conn.execute("UPDATE tasks SET status='running' WHERE task_id=?", (task_id,))
    conn.commit()

    try:
        api_params = build_api_params(search_params)
        all_jobs = []
        page = 1
        cancelled = False

        with JobClient(
            min_delay=app_config.MIN_DELAY_SECONDS,
            max_delay=app_config.MAX_DELAY_SECONDS,
        ) as client:
            while True:
                if _should_stop(task_id):
                    cancelled = True
                    break

                raw = client.fetch_jobs_page({**api_params, "page": page})
                jobs, total_count, total_pages = parser.parse_response(raw)
                all_jobs.extend(jobs)

                _set_progress(
                    task_id,
                    current_page=page,
                    total_pages=total_pages,
                    collected=len(all_jobs),
                    total=total_count,
                )

                if page >= total_pages or total_pages == 0:
                    break
                if max_pages is not None and page >= max_pages:
                    break

                client.rate_limit_delay()
                page += 1

        # Deduplicate by job_id before inserting
        seen: set[str] = set()
        unique_jobs = []
        for job in all_jobs:
            jid = job.to_flat_dict().get("job_id") or ""
            if jid and jid in seen:
                continue
            seen.add(jid)
            unique_jobs.append(job)
        all_jobs = unique_jobs

        # Bulk-insert jobs
        for job in all_jobs:
            d = job.to_flat_dict()
            conn.execute(
                """
                INSERT INTO jobs (
                    task_id, job_id, job_url, job_name, company_name, company_url,
                    salary_low, salary_high, salary_desc, job_addr_no_desc, job_address,
                    job_type, period_desc, option_edu, appear_date, apply_cnt,
                    apply_desc, tags, scraped_at
                ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """,
                (
                    task_id,
                    d["job_id"], d["job_url"], d["job_name"],
                    d["company_name"], d["company_url"],
                    d["salary_low"], d["salary_high"], d["salary_desc"],
                    d["job_addr_no_desc"], d["job_address"],
                    d["job_type"], d["period_desc"], d["option_edu"],
                    d["appear_date"], d["apply_cnt"], d["apply_desc"],
                    d["tags"], d["scraped_at"],
                ),
            )

        completed_at = datetime.now().isoformat()
        final_status = "cancelled" if cancelled else "done"
        conn.execute(
            "UPDATE tasks SET status=?, completed_at=?, total_jobs=? WHERE task_id=?",
            (final_status, completed_at, len(all_jobs), task_id),
        )
        conn.commit()
        _set_progress(task_id, status=final_status, cancelled=cancelled)

    except Exception as exc:
        error_msg = str(exc)
        conn.execute(
            "UPDATE tasks SET status='failed', error=? WHERE task_id=?",
            (error_msg, task_id),
        )
        conn.commit()
        _set_progress(task_id, status="failed", error=error_msg)

    finally:
        conn.close()
        _cleanup_task(task_id)


# ---------------------------------------------------------------------------
# Statistics computation (called on completed task results)
# ---------------------------------------------------------------------------

_SALARY_BUCKETS = ["未填寫", "< 3萬", "3–4萬", "4–5萬", "5–7萬", "> 7萬"]
_JOB_TYPE_MAP = {0: "全職", 1: "兼職", 2: "假日工作", 3: "派遣", 9: "約聘雇"}


def _salary_bucket(row: dict) -> str:
    low = row.get("salary_low") or 0
    high = row.get("salary_high") or 0
    mid = (low + high) / 2 if (low and high) else (low or high)
    if mid == 0:
        return "未填寫"
    elif mid < 30000:
        return "< 3萬"
    elif mid < 40000:
        return "3–4萬"
    elif mid < 50000:
        return "4–5萬"
    elif mid < 70000:
        return "5–7萬"
    else:
        return "> 7萬"


def compute_stats(jobs: list[dict]) -> dict:
    """Aggregate job rows into visualization-ready statistics."""
    if not jobs:
        return {
            "salary_distribution": [{"label": b, "count": 0} for b in _SALARY_BUCKETS],
            "area_distribution": [],
            "job_type_distribution": [],
            "kpi": {
                "total_jobs": 0,
                "avg_salary_low": None,
                "top_area": None,
                "disclosed_salary_pct": 0,
            },
        }

    df = pd.DataFrame(jobs)

    # Salary distribution
    df["salary_bucket"] = df.apply(_salary_bucket, axis=1)
    salary_counts = df["salary_bucket"].value_counts()
    salary_distribution = [
        {"label": b, "count": int(salary_counts.get(b, 0))}
        for b in _SALARY_BUCKETS
    ]

    # Area distribution (top 10)
    area_distribution = []
    if "job_addr_no_desc" in df.columns:
        area_counts = df["job_addr_no_desc"].value_counts().head(10)
        area_distribution = [
            {"area": str(k), "count": int(v)} for k, v in area_counts.items()
        ]

    # Job type distribution
    job_type_distribution = []
    if "job_type" in df.columns:
        def map_type(val):
            try:
                return _JOB_TYPE_MAP.get(int(val) if val is not None else 0, "其他")
            except (ValueError, TypeError):
                return "其他"
        type_counts = df["job_type"].apply(map_type).value_counts()
        job_type_distribution = [
            {"label": str(k), "count": int(v)} for k, v in type_counts.items()
        ]

    # KPI
    has_salary = df[(df["salary_low"].notna()) & (df["salary_low"] > 0)]
    avg_salary_low = int(has_salary["salary_low"].mean()) if len(has_salary) > 0 else None
    disclosed_pct = round(len(has_salary) / len(df) * 100, 1) if len(df) > 0 else 0
    top_area = area_distribution[0]["area"] if area_distribution else None

    return {
        "salary_distribution": salary_distribution,
        "area_distribution": area_distribution,
        "job_type_distribution": job_type_distribution,
        "kpi": {
            "total_jobs": len(jobs),
            "avg_salary_low": avg_salary_low,
            "top_area": top_area,
            "disclosed_salary_pct": disclosed_pct,
        },
    }
