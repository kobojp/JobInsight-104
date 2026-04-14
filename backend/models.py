"""Pydantic models for request/response schemas."""

from typing import Optional
from pydantic import BaseModel, Field


class SearchRequest(BaseModel):
    keyword: str = ""
    area: str = "taipei"           # comma-separated area names from config.AREA_CODES
    order: str = "relevance"       # relevance | date | salary | views
    max_pages: Optional[int] = None
    pagesize: int = Field(default=20, ge=1, le=20)
    # Optional 104 API filters (passed through directly)
    ro: Optional[str] = None       # job type: 1=全職, 4=兼職
    s5: Optional[str] = None       # two-day weekend: 1=yes
    salary_from: Optional[int] = None
    salary_to: Optional[int] = None
