"""
SQLite storage for tasks and scraped jobs.
All functions are synchronous — called from background threads.
"""

import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "jobinsight.db"


def init_db() -> None:
    """Create tables if they don't exist. Called once at startup."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS tasks (
            task_id     TEXT PRIMARY KEY,
            status      TEXT NOT NULL DEFAULT 'pending',
            params      TEXT,
            error       TEXT,
            created_at  TEXT,
            completed_at TEXT,
            total_jobs  INTEGER DEFAULT 0
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS jobs (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            task_id          TEXT NOT NULL,
            job_id           TEXT,
            job_url          TEXT,
            job_name         TEXT,
            company_name     TEXT,
            company_url      TEXT,
            salary_low       INTEGER,
            salary_high      INTEGER,
            salary_desc      TEXT,
            job_addr_no_desc TEXT,
            job_address      TEXT,
            job_type         INTEGER,
            period_desc      TEXT,
            option_edu       TEXT,
            appear_date      TEXT,
            apply_cnt        INTEGER,
            apply_desc       TEXT,
            tags             TEXT,
            scraped_at       TEXT
        )
    """)
    conn.commit()
    conn.close()


def create_task(task_id: str, params: dict, created_at: str) -> None:
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute(
        "INSERT INTO tasks (task_id, status, params, created_at) VALUES (?, 'pending', ?, ?)",
        (task_id, json.dumps(params, ensure_ascii=False), created_at),
    )
    conn.commit()
    conn.close()


def get_task(task_id: str) -> dict | None:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM tasks WHERE task_id=?", (task_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def list_tasks(limit: int = 20) -> list[dict]:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT task_id, status, params, created_at, completed_at, total_jobs "
        "FROM tasks ORDER BY created_at DESC LIMIT ?",
        (limit,),
    ).fetchall()
    conn.close()
    result = []
    for r in rows:
        item = dict(r)
        if item.get("params"):
            try:
                item["params"] = json.loads(item["params"])
            except Exception:
                pass
        result.append(item)
    return result


def delete_tasks(task_ids: list[str]) -> int:
    """Delete tasks and their jobs. Returns number of tasks deleted."""
    if not task_ids:
        return 0
    placeholders = ",".join("?" * len(task_ids))
    conn = sqlite3.connect(str(DB_PATH))
    conn.execute(f"DELETE FROM jobs WHERE task_id IN ({placeholders})", task_ids)
    cur = conn.execute(f"DELETE FROM tasks WHERE task_id IN ({placeholders})", task_ids)
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    return deleted


def get_jobs(task_id: str) -> list[dict]:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM jobs WHERE id IN (SELECT MIN(id) FROM jobs WHERE task_id=? GROUP BY job_id) ORDER BY id",
        (task_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_filter_options(task_id: str) -> dict:
    """Return distinct values for filter dropdowns (computed once on full dataset)."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    # Distinct areas (full address like "台北市信義區")
    area_rows = conn.execute(
        "SELECT DISTINCT job_addr_no_desc FROM jobs WHERE task_id=? AND job_addr_no_desc IS NOT NULL ORDER BY job_addr_no_desc",
        (task_id,),
    ).fetchall()

    # Salary range
    sal_row = conn.execute(
        "SELECT MIN(salary_low) as min_sal, MAX(salary_low) as max_sal "
        "FROM jobs WHERE task_id=? AND salary_low > 0",
        (task_id,),
    ).fetchone()

    # Apply count range
    apply_row = conn.execute(
        "SELECT MIN(apply_cnt) as min_apply, MAX(apply_cnt) as max_apply "
        "FROM jobs WHERE task_id=? AND apply_cnt IS NOT NULL",
        (task_id,),
    ).fetchone()

    # Date range
    date_row = conn.execute(
        "SELECT MIN(appear_date) as min_date, MAX(appear_date) as max_date "
        "FROM jobs WHERE task_id=? AND appear_date IS NOT NULL",
        (task_id,),
    ).fetchone()

    # Tags (pipe-separated, split and deduplicate)
    tag_rows = conn.execute(
        "SELECT tags FROM jobs WHERE task_id=? AND tags IS NOT NULL AND tags != ''",
        (task_id,),
    ).fetchall()
    conn.close()

    # Parse city / district from address strings
    cities: dict[str, set] = {}
    for r in area_rows:
        addr = r["job_addr_no_desc"] or ""
        # First 3 chars usually = city (台北市 / 新北市 / 台中市 ...)
        # Find split: city ends at 市/縣, district is remainder
        city, district = _split_address(addr)
        if city:
            cities.setdefault(city, set())
            if district:
                cities[city].add(district)

    cities_out = {c: sorted(d) for c, d in sorted(cities.items())}

    # Flatten all tags
    all_tags: set[str] = set()
    for r in tag_rows:
        for t in (r["tags"] or "").split("|"):
            t = t.strip()
            if t:
                all_tags.add(t)

    return {
        "cities": cities_out,
        "salary_range": {
            "min": int(sal_row["min_sal"]) if sal_row["min_sal"] else 0,
            "max": int(sal_row["max_sal"]) if sal_row["max_sal"] else 0,
        },
        "apply_range": {
            "min": int(apply_row["min_apply"]) if apply_row["min_apply"] is not None else 0,
            "max": int(apply_row["max_apply"]) if apply_row["max_apply"] is not None else 0,
        },
        "date_range": {
            "min": date_row["min_date"] or "",
            "max": date_row["max_date"] or "",
        },
        "tags": sorted(all_tags),
    }


def _split_address(addr: str) -> tuple[str, str]:
    """Split '台北市信義區' -> ('台北市', '信義區'). Returns ('', '') on failure."""
    for i, ch in enumerate(addr):
        if ch in ("市", "縣"):
            city = addr[: i + 1]
            district = addr[i + 1:]
            return city, district
    return addr, ""


def get_jobs_filtered(
    task_id: str,
    *,
    areas: list[str] | None = None,
    districts: list[str] | None = None,
    salary_min: int | None = None,
    job_name: str | None = None,
    company: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    apply_min: int | None = None,
    apply_max: int | None = None,
    tags: list[str] | None = None,
    sort_by: str = "appear_date",
    sort_dir: str = "desc",
    page: int = 1,
    page_size: int = 50,
) -> tuple[list[dict], int]:
    """Return (jobs_page, total_count) after applying filters."""
    allowed_sort = {"appear_date", "salary_low", "apply_cnt", "id"}
    if sort_by not in allowed_sort:
        sort_by = "appear_date"
    sort_dir = "DESC" if sort_dir.lower() == "desc" else "ASC"

    conditions = ["task_id = ?"]
    params: list = [task_id]

    if areas:
        placeholders = ",".join("?" * len(areas))
        conditions.append(
            f"({' OR '.join(['job_addr_no_desc LIKE ?' for _ in areas])})"
        )
        for a in areas:
            params.append(f"{a}%")

    if districts:
        conditions.append(
            f"({' OR '.join(['job_addr_no_desc LIKE ?' for _ in districts])})"
        )
        for d in districts:
            params.append(f"%{d}%")

    if salary_min is not None:
        conditions.append("(salary_low IS NULL OR salary_low = 0 OR salary_low >= ?)")
        params.append(salary_min)

    if job_name:
        conditions.append("job_name LIKE ?")
        params.append(f"%{job_name}%")

    if company:
        conditions.append("company_name LIKE ?")
        params.append(f"%{company}%")

    if date_from:
        conditions.append("appear_date >= ?")
        params.append(date_from)

    if date_to:
        conditions.append("appear_date <= ?")
        params.append(date_to)

    if apply_min is not None:
        conditions.append("apply_cnt >= ?")
        params.append(apply_min)

    if apply_max is not None:
        conditions.append("apply_cnt <= ?")
        params.append(apply_max)

    if tags:
        for t in tags:
            conditions.append("tags LIKE ?")
            params.append(f"%{t}%")

    where = " AND ".join(conditions)

    # Deduplicate by job_id, keep the row with the smallest id
    dedup_subquery = (
        f"SELECT MIN(id) as id FROM jobs WHERE {where} GROUP BY job_id"
    )
    dedup_where = f"id IN ({dedup_subquery})"

    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row

    total = conn.execute(
        f"SELECT COUNT(*) FROM jobs WHERE {dedup_where}", params
    ).fetchone()[0]

    offset = (page - 1) * page_size
    rows = conn.execute(
        f"SELECT * FROM jobs WHERE {dedup_where} ORDER BY {sort_by} {sort_dir} LIMIT ? OFFSET ?",
        params + [page_size, offset],
    ).fetchall()
    conn.close()

    return [dict(r) for r in rows], total
