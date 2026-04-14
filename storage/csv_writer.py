"""
CSV output writer for JobInsight-104.
Uses utf-8-sig encoding for Excel compatibility on Windows/Taiwan locale.
"""

import csv
import dataclasses
import logging
from pathlib import Path
from typing import List, Union

from scraper.models import JobListing

logger = logging.getLogger(__name__)


def get_csv_fieldnames() -> List[str]:
    """Return ordered field names derived from the JobListing dataclass."""
    return [f.name for f in dataclasses.fields(JobListing)]


def write_csv(
    jobs: List[JobListing],
    filepath: Union[str, Path],
) -> int:
    """
    Write job listings to a CSV file.

    Args:
        jobs: List of JobListing instances.
        filepath: Destination file path.

    Returns:
        Number of rows written.
    """
    filepath = Path(filepath)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    fieldnames = get_csv_fieldnames()

    with open(filepath, "w", newline="", encoding="utf-8-sig") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        for job in jobs:
            writer.writerow(job.to_flat_dict())

    logger.info("Wrote %d rows to %s", len(jobs), filepath)
    return len(jobs)
