"""
Pure parsing functions for 104.com.tw API responses.
No I/O, no state — fully unit-testable with fixture dicts.
"""

from typing import List, Optional, Tuple

from .models import JobListing

BASE_JOB_URL = "https://www.104.com.tw"


def parse_response(raw: dict) -> Tuple[List[JobListing], int, int]:
    """
    Parse a full API response.

    Actual response structure:
        {
          "data": [ {...job}, ... ],
          "metadata": {
            "pagination": {
              "total": 268,
              "lastPage": 134,
              "currentPage": 1,
              "count": 20
            }
          }
        }

    Returns:
        (jobs, total_count, total_pages)
    """
    pagination = raw.get("metadata", {}).get("pagination", {})
    total_count = int(pagination.get("total", 0))
    total_pages = int(pagination.get("lastPage", 0))
    raw_list = raw.get("data", [])
    jobs = [parse_job(item) for item in raw_list]
    return jobs, total_count, total_pages


def parse_job(raw_job: dict) -> JobListing:
    """Parse a single job dict from the data[] array."""
    link = raw_job.get("link", {})
    # link URLs are already absolute in the actual API response
    job_url = link.get("job", "")
    company_url = link.get("cust", "")

    # Fallback: prepend base if path is relative
    if job_url and job_url.startswith("/"):
        job_url = BASE_JOB_URL + job_url
    if company_url and company_url.startswith("/"):
        company_url = BASE_JOB_URL + company_url

    tags = _parse_tags(raw_job.get("tags", {}))

    # optionEdu is a list of ints; join for storage
    option_edu_raw = raw_job.get("optionEdu", [])
    option_edu = "|".join(str(x) for x in option_edu_raw) if isinstance(option_edu_raw, list) else str(option_edu_raw)

    return JobListing(
        job_id=str(raw_job.get("jobNo", "")),
        job_url=job_url,
        job_name=raw_job.get("jobName", ""),
        company_name=raw_job.get("custName", ""),
        company_url=company_url,
        salary_desc=raw_job.get("salaryDesc", ""),
        salary_low=_safe_int(raw_job.get("salaryLow")),
        salary_high=_safe_int(raw_job.get("salaryHigh")),
        job_addr_no_desc=raw_job.get("jobAddrNoDesc", ""),
        job_address=raw_job.get("jobAddress", ""),
        job_type=int(raw_job.get("jobType", 0)),
        period_desc=raw_job.get("periodDesc", ""),
        option_edu=option_edu,
        appear_date=raw_job.get("appearDate", ""),
        apply_cnt=int(raw_job.get("applyCnt", 0)),
        apply_desc=raw_job.get("applyDesc", ""),
        tags=tags,
    )


def _parse_tags(raw_tags) -> List[str]:
    """Extract tag desc values from the tags field.

    The actual API returns tags as a dict of named categories, e.g.:
        {"zone": {"desc": "大台北", "param": 16}, "wf7": {"desc": "", ...}}

    We extract non-empty desc values.
    Also handles legacy list shapes for forward compatibility.
    """
    result = []
    if isinstance(raw_tags, dict):
        for tag_val in raw_tags.values():
            if isinstance(tag_val, dict):
                desc = tag_val.get("desc", "")
                if desc:
                    result.append(str(desc))
    elif isinstance(raw_tags, list):
        for tag in raw_tags:
            if isinstance(tag, dict):
                name = tag.get("desc") or tag.get("name") or tag.get("label", "")
                if name:
                    result.append(str(name))
            elif isinstance(tag, str) and tag:
                result.append(tag)
    return result


def _safe_int(val, default: Optional[int] = None) -> Optional[int]:
    """Convert to int, returning default for None/non-numeric values.

    Note: 0 is a valid integer and is returned as-is, not treated as missing.
    """
    if val is None:
        return default
    try:
        return int(val)
    except (ValueError, TypeError):
        return default
