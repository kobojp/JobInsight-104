"""
JobInsight-104 Scraper package.
"""

import logging
from typing import List, Optional

from .client import JobClient, ScraperError
from .models import JobListing
from . import parser

logger = logging.getLogger(__name__)


class Scraper:
    """
    Orchestrates pagination and coordinates client + parser.

    Usage:
        with JobClient() as client:
            scraper = Scraper(client)
            jobs = scraper.scrape(params, max_pages=5)
    """

    def __init__(self, client: JobClient):
        self.client = client

    def scrape(
        self,
        params: dict,
        max_pages: Optional[int] = None,
    ) -> List[JobListing]:
        """
        Scrape job listings with automatic pagination.

        Args:
            params: API query parameters (keyword, area, order, pagesize, etc.)
            max_pages: Stop after this many pages (None = scrape all pages).

        Returns:
            List of JobListing dataclass instances.
        """
        all_jobs: List[JobListing] = []
        page = 1

        while True:
            params = {**params, "page": page}
            logger.info("Fetching page %d%s ...",
                        page,
                        f"/{max_pages}" if max_pages else "")

            raw = self.client.fetch_jobs_page(params)
            jobs, total_count, total_pages = parser.parse_response(raw)

            all_jobs.extend(jobs)
            logger.info(
                "Page %d/%d — %d/%d jobs collected",
                page, total_pages, len(all_jobs), total_count,
            )

            if page >= total_pages or total_pages == 0:
                break
            if max_pages is not None and page >= max_pages:
                logger.info("Reached max_pages limit (%d)", max_pages)
                break

            self.client.rate_limit_delay()
            page += 1

        return all_jobs


__all__ = ["JobClient", "ScraperError", "JobListing", "Scraper"]
