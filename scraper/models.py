"""
Data models for JobInsight-104.
"""

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import Optional, List


@dataclass
class JobListing:
    # Identity
    job_id:           str
    job_url:          str

    # Core display fields
    job_name:         str
    company_name:     str
    company_url:      str

    # Compensation
    salary_desc:      str
    salary_low:       Optional[int]
    salary_high:      Optional[int]

    # Location
    job_addr_no_desc: str
    job_address:      str

    # Classification
    job_type:         int
    period_desc:      str
    option_edu:       str

    # Metadata
    appear_date:      str
    apply_cnt:        int
    apply_desc:       str

    # Tags / skills
    tags:             List[str] = field(default_factory=list)

    # Scrape metadata
    scraped_at:       str = field(
        default_factory=lambda: datetime.now().isoformat()
    )

    def to_dict(self) -> dict:
        return asdict(self)

    def to_flat_dict(self) -> dict:
        """Flatten for CSV: join list fields, stringify everything."""
        d = self.to_dict()
        d["tags"] = "|".join(d["tags"])
        return d
