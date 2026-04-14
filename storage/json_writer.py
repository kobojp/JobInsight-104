"""
JSON output writer for JobInsight-104.
Wraps job data in an envelope with metadata.
"""

import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Union

from scraper.models import JobListing

logger = logging.getLogger(__name__)


def write_json(
    jobs: List[JobListing],
    filepath: Union[str, Path],
    metadata: Optional[Dict] = None,
) -> int:
    """
    Write job listings to a JSON file with a metadata envelope.

    Args:
        jobs: List of JobListing instances.
        filepath: Destination file path.
        metadata: Optional extra fields to include in the metadata section.

    Returns:
        Number of records written.
    """
    filepath = Path(filepath)
    filepath.parent.mkdir(parents=True, exist_ok=True)

    envelope = {
        "metadata": {
            "scraped_at": datetime.now().isoformat(),
            "total_jobs": len(jobs),
            **(metadata or {}),
        },
        "jobs": [job.to_dict() for job in jobs],
    }

    with open(filepath, "w", encoding="utf-8") as fh:
        json.dump(envelope, fh, ensure_ascii=False, indent=2)

    logger.info("Wrote %d records to %s", len(jobs), filepath)
    return len(jobs)


def append_json(
    jobs: List[JobListing],
    filepath: Union[str, Path],
) -> int:
    """
    Append jobs to an existing JSON file, deduplicating by job_id.

    Args:
        jobs: New jobs to append.
        filepath: Path to existing JSON file (will be created if absent).

    Returns:
        Total number of unique records in the file after appending.
    """
    filepath = Path(filepath)

    existing_jobs: List[dict] = []
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as fh:
            data = json.load(fh)
            existing_jobs = data.get("jobs", [])

    existing_ids = {j["job_id"] for j in existing_jobs}
    new_jobs = [j.to_dict() for j in jobs if j.job_id not in existing_ids]
    all_jobs = existing_jobs + new_jobs

    envelope = {
        "metadata": {
            "scraped_at": datetime.now().isoformat(),
            "total_jobs": len(all_jobs),
        },
        "jobs": all_jobs,
    }

    with open(filepath, "w", encoding="utf-8") as fh:
        json.dump(envelope, fh, ensure_ascii=False, indent=2)

    logger.info(
        "Appended %d new records (total: %d) to %s",
        len(new_jobs), len(all_jobs), filepath,
    )
    return len(all_jobs)
