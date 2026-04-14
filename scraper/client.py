"""
HTTP client for 104.com.tw API.
Manages session, headers, rate limiting.
"""

import logging
import random
import time
from typing import Optional

import requests

import config

logger = logging.getLogger(__name__)


class ScraperError(Exception):
    """Raised when the API returns a non-200 response."""

    def __init__(self, message: str, status_code: int = 0, url: str = ""):
        super().__init__(message)
        self.status_code = status_code
        self.url = url


class JobClient:
    """
    HTTP client for 104.com.tw job search API.

    Usage:
        with JobClient() as client:
            raw = client.fetch_jobs_page(params)
    """

    def __init__(
        self,
        min_delay: float = config.MIN_DELAY_SECONDS,
        max_delay: float = config.MAX_DELAY_SECONDS,
        timeout: int = 15,
    ):
        self.min_delay = min_delay
        self.max_delay = max_delay
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent":      config.USER_AGENT,
            "Referer":         config.BASE_REFERER,
            "Accept":          "application/json, text/plain, */*",
            "Accept-Language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection":      "keep-alive",
            "Sec-Fetch-Dest":  "empty",
            "Sec-Fetch-Mode":  "cors",
            "Sec-Fetch-Site":  "same-origin",
        })

    def fetch_jobs_page(self, params: dict) -> dict:
        """
        Fetch one page of job listings.

        Args:
            params: Query parameters for the API (page, keyword, area, etc.)

        Returns:
            Parsed JSON response as dict.

        Raises:
            ScraperError: On non-200 HTTP status.
        """
        logger.debug("GET %s params=%s", config.BASE_SEARCH_URL, params)
        try:
            resp = self.session.get(
                config.BASE_SEARCH_URL,
                params=params,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise ScraperError(f"Request failed: {exc}") from exc

        if resp.status_code != 200:
            raise ScraperError(
                f"HTTP {resp.status_code} from {resp.url}",
                status_code=resp.status_code,
                url=resp.url,
            )

        try:
            return resp.json()
        except ValueError as exc:
            raise ScraperError(f"Invalid JSON response: {exc}") from exc

    def rate_limit_delay(self) -> None:
        """Sleep a random duration between min_delay and max_delay."""
        delay = random.uniform(self.min_delay, self.max_delay)
        logger.debug("Rate limit delay: %.1fs", delay)
        time.sleep(delay)

    def close(self) -> None:
        self.session.close()

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
