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


# ---------------------------------------------------------------------------
# PDF endpoint (Playwright server-side rendering)
# ---------------------------------------------------------------------------

import asyncio
import html as _html
from datetime import datetime
from pydantic import BaseModel
from playwright.sync_api import sync_playwright
from backend.services.scraper_service import compute_stats


class PdfExportRequest(BaseModel):
    filtered: bool = False
    charts_b64: str = ""
    areas: Optional[str] = None
    districts: Optional[str] = None
    salary_min: Optional[int] = None
    job_name: Optional[str] = None
    company: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    apply_min: Optional[int] = None
    apply_max: Optional[int] = None
    tags: Optional[str] = None
    sort_by: str = "appear_date"
    sort_dir: str = "desc"


def _build_pdf_html(jobs: list[dict], stats: dict, total: int,
                    label: str, charts_b64: str, now_str: str) -> str:
    kpi = stats.get("kpi", {})
    avg_salary_low = kpi.get("avg_salary_low")
    top_area = kpi.get("top_area") or ""
    disclosed_pct = kpi.get("disclosed_salary_pct", 0)
    avg_salary_str = f"{avg_salary_low // 1000}K" if avg_salary_low else "N/A"

    charts_html = ""
    if charts_b64:
        charts_html = f'<div class="charts"><img src="{charts_b64}" /></div>'

    rows_html = ""
    for i, job in enumerate(jobs):
        shade = "even" if i % 2 == 0 else "odd"
        salary_low = job.get("salary_low") or 0
        salary_high = job.get("salary_high") or 0
        if salary_low and salary_high:
            salary = f"{salary_low // 1000}K–{salary_high // 1000}K"
        elif salary_low:
            salary = f"{salary_low // 1000}K+"
        else:
            salary = _html.escape(str(job.get("salary_desc") or "未揭露"))

        job_name = _html.escape(str(job.get("job_name") or ""))
        company  = _html.escape(str(job.get("company_name") or ""))
        area     = _html.escape(str(job.get("job_addr_no_desc") or ""))
        date     = _html.escape(str(job.get("appear_date") or ""))
        cnt      = _html.escape(str(job.get("apply_cnt") or ""))
        url      = _html.escape(str(job.get("job_url") or ""))

        rows_html += f"""<tr class="{shade}">
          <td><a href="{url}">{job_name}</a></td>
          <td>{company}</td><td>{area}</td>
          <td>{salary}</td><td>{date}</td><td>{cnt}</td>
        </tr>\n"""

    return f"""<!DOCTYPE html>
<html lang="zh-TW"><head><meta charset="UTF-8"><style>
  @page {{ size: A4 landscape; margin: 12mm; }}
  * {{ box-sizing: border-box; }}
  body {{
    font-family: "Microsoft JhengHei","PingFang TC","Noto Sans CJK TC","Heiti TC",Arial,sans-serif;
    font-size: 9px; color: #1f2937; margin: 0; padding: 0;
  }}
  h1 {{ font-size: 16px; font-weight: 700; margin: 0 0 3px; color: #111; }}
  .sub {{ color: #6b7280; font-size: 8px; margin-bottom: 2px; font-family: monospace; }}
  .kpi {{ font-size: 8px; color: #374151; margin-bottom: 8px; font-family: monospace; }}
  .charts {{ margin-bottom: 8px; }}
  .charts img {{ max-width: 100%; height: auto; display: block; }}
  table {{ width: 100%; border-collapse: collapse; }}
  thead tr {{ background: #3b82f6; color: #fff; }}
  th {{ padding: 4px 5px; text-align: left; font-size: 8px; font-weight: 600; }}
  td {{ padding: 3px 5px; border-bottom: 1px solid #e5e7eb; font-size: 8px; vertical-align: top; }}
  tr.even {{ background: #f9fafb; }} tr.odd {{ background: #fff; }}
  a {{ color: #2563eb; text-decoration: none; }}
  .c1 {{ width: 22%; }} .c2 {{ width: 16%; }} .c3 {{ width: 12%; }}
  .c4 {{ width: 11%; }} .c5 {{ width: 10%; }} .c6 {{ width: 8%; }}
</style></head><body>
  <h1>JobInsight-104 Report</h1>
  <div class="sub">{label} | Total: {total} jobs | Generated: {now_str}</div>
  <div class="kpi">Jobs: {total} &nbsp;|&nbsp; Avg Salary: {avg_salary_str} &nbsp;|&nbsp; Top Area: {_html.escape(top_area)} &nbsp;|&nbsp; Disclosed: {disclosed_pct}%</div>
  {charts_html}
  <table>
    <thead><tr>
      <th class="c1">職缺名稱</th><th class="c2">公司名稱</th><th class="c3">地區</th>
      <th class="c4">薪資</th><th class="c5">刊登日</th><th class="c6">應徵人數</th>
    </tr></thead>
    <tbody>{rows_html}</tbody>
  </table>
</body></html>"""


def _html_to_pdf_sync(html_content: str) -> bytes:
    """Run Playwright in sync mode (avoids Windows asyncio subprocess limitation)."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html_content, wait_until="networkidle")
        pdf_bytes = page.pdf(
            format="A4",
            landscape=True,
            print_background=True,
            margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"},
        )
        browser.close()
    return pdf_bytes


async def _html_to_pdf(html_content: str) -> bytes:
    """Run sync Playwright in a thread pool to avoid blocking the event loop."""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, _html_to_pdf_sync, html_content)


@router.post("/tasks/{task_id}/export/pdf")
async def export_pdf(task_id: str, req: PdfExportRequest):
    """Server-side PDF generation via Playwright (full CJK support)."""
    _check_task_done(task_id)
    filter_kwargs = _parse_filter_kwargs(
        req.areas, req.districts, req.salary_min, req.job_name, req.company,
        req.date_from, req.date_to, req.apply_min, req.apply_max, req.tags,
        req.sort_by, req.sort_dir,
    )
    jobs = _resolve_jobs(task_id, req.filtered, filter_kwargs)
    stats = compute_stats(jobs)

    label = "Filtered" if req.filtered else "All"
    now_str = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
    html_content = _build_pdf_html(jobs, stats, len(jobs), label, req.charts_b64, now_str)

    try:
        pdf_bytes = await _html_to_pdf(html_content)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc}")

    suffix = "filtered" if req.filtered else "all"
    filename = f"jobinsight_{task_id[:8]}_{suffix}.pdf"
    return StreamingResponse(
        iter([pdf_bytes]),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
