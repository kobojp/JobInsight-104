"""
Unit tests for scraper/parser.py
No network calls — all tests use fixture dicts.
"""

import sys
import os

# Ensure the project root is on sys.path so imports resolve correctly.
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest

from scraper.parser import parse_response, parse_job, _parse_tags, _safe_int
from scraper.models import JobListing

# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------

def _make_raw_job(**overrides) -> dict:
    """Return a minimal valid raw job dict, with optional field overrides."""
    base = {
        "jobId":          "12345678",
        "jobName":        "Senior Python Engineer",
        "custName":       "Acme Corp",
        "salaryDesc":     "月薪 60,000~80,000 元",
        "salaryLow":      60000,
        "salaryHigh":     80000,
        "jobAddrNoDesc":  "台北市",
        "jobAddress":     "台北市大安區",
        "jobType":        1,
        "periodDesc":     "全職",
        "optionEdu":      "大學",
        "appearDate":     "2024/01/15",
        "applyCnt":       42,
        "applyDesc":      "應徵人數 42 人",
        "tags":           [],
        "link": {
            "job":  "/job/12345678",
            "cust": "/company/abcdef",
        },
    }
    base.update(overrides)
    return base


def _make_raw_response(jobs=None, total_count=1, total_pages=1) -> dict:
    """Return a minimal valid API response envelope."""
    if jobs is None:
        jobs = [_make_raw_job()]
    return {
        "data": {
            "totalCount": total_count,
            "totalPage":  total_pages,
            "list":       jobs,
        }
    }


# ---------------------------------------------------------------------------
# parse_response tests
# ---------------------------------------------------------------------------

class TestParseResponse:
    def test_returns_tuple_of_three(self):
        raw = _make_raw_response()
        result = parse_response(raw)
        assert isinstance(result, tuple) and len(result) == 3

    def test_correct_total_count_and_pages(self):
        raw = _make_raw_response(total_count=150, total_pages=8)
        jobs, total_count, total_pages = parse_response(raw)
        assert total_count == 150
        assert total_pages == 8

    def test_parses_all_jobs_in_list(self):
        raw = _make_raw_response(
            jobs=[_make_raw_job(jobId="1"), _make_raw_job(jobId="2"), _make_raw_job(jobId="3")],
            total_count=3,
            total_pages=1,
        )
        jobs, _, _ = parse_response(raw)
        assert len(jobs) == 3

    def test_each_item_is_job_listing(self):
        raw = _make_raw_response()
        jobs, _, _ = parse_response(raw)
        assert all(isinstance(j, JobListing) for j in jobs)

    def test_empty_data_returns_empty_list(self):
        raw = {"data": {"totalCount": 0, "totalPage": 0, "list": []}}
        jobs, count, pages = parse_response(raw)
        assert jobs == []
        assert count == 0
        assert pages == 0

    def test_missing_data_key_is_handled(self):
        # raw.get("data", {}) should return empty dict safely
        raw = {}
        jobs, count, pages = parse_response(raw)
        assert jobs == []
        assert count == 0
        assert pages == 0

    def test_total_count_as_string_is_coerced(self):
        raw = {
            "data": {
                "totalCount": "99",
                "totalPage":  "5",
                "list":       [],
            }
        }
        _, count, pages = parse_response(raw)
        assert count == 99
        assert pages == 5


# ---------------------------------------------------------------------------
# parse_job tests
# ---------------------------------------------------------------------------

class TestParseJob:
    def test_returns_job_listing_instance(self):
        job = parse_job(_make_raw_job())
        assert isinstance(job, JobListing)

    def test_job_id_is_string(self):
        job = parse_job(_make_raw_job(jobId=99999))
        assert job.job_id == "99999"

    def test_job_name_mapped_correctly(self):
        job = parse_job(_make_raw_job(jobName="資料工程師"))
        assert job.job_name == "資料工程師"

    def test_company_name_mapped_correctly(self):
        job = parse_job(_make_raw_job(custName="TechCo Ltd"))
        assert job.company_name == "TechCo Ltd"

    def test_salary_low_and_high_parsed(self):
        job = parse_job(_make_raw_job(salaryLow=50000, salaryHigh=70000))
        assert job.salary_low == 50000
        assert job.salary_high == 70000

    def test_salary_none_when_missing(self):
        raw = _make_raw_job()
        del raw["salaryLow"]
        del raw["salaryHigh"]
        job = parse_job(raw)
        assert job.salary_low is None
        assert job.salary_high is None

    def test_apply_cnt_is_int(self):
        job = parse_job(_make_raw_job(applyCnt=7))
        assert job.apply_cnt == 7

    def test_job_type_is_int(self):
        job = parse_job(_make_raw_job(jobType=2))
        assert job.job_type == 2

    def test_appear_date(self):
        job = parse_job(_make_raw_job(appearDate="2024/03/01"))
        assert job.appear_date == "2024/03/01"

    def test_tags_default_to_empty_list(self):
        job = parse_job(_make_raw_job(tags=[]))
        assert job.tags == []

    def test_tags_are_parsed(self):
        raw = _make_raw_job(tags=[{"name": "Python"}, {"name": "Django"}])
        job = parse_job(raw)
        assert "Python" in job.tags
        assert "Django" in job.tags

    def test_scraped_at_is_populated(self):
        job = parse_job(_make_raw_job())
        assert job.scraped_at  # non-empty string
        assert "T" in job.scraped_at  # isoformat contains 'T'

    # --- job_url absolute URL tests ---

    def test_job_url_is_absolute_when_path_starts_with_slash(self):
        raw = _make_raw_job(link={"job": "/job/12345678", "cust": "/company/abc"})
        job = parse_job(raw)
        assert job.job_url.startswith("https://")

    def test_job_url_correct_value_for_relative_path(self):
        raw = _make_raw_job(link={"job": "/job/12345678", "cust": "/company/abc"})
        job = parse_job(raw)
        assert job.job_url == "https://www.104.com.tw/job/12345678"

    def test_company_url_is_absolute(self):
        raw = _make_raw_job(link={"job": "/job/12345678", "cust": "/company/abc"})
        job = parse_job(raw)
        assert job.company_url.startswith("https://")

    def test_job_url_passthrough_when_already_absolute(self):
        full_url = "https://www.104.com.tw/job/99999"
        raw = _make_raw_job(link={"job": full_url, "cust": ""})
        job = parse_job(raw)
        assert job.job_url == full_url

    def test_job_url_empty_when_no_link(self):
        raw = _make_raw_job()
        raw.pop("link", None)
        job = parse_job(raw)
        # Should not crash; link defaults to {}
        assert isinstance(job.job_url, str)

    def test_missing_optional_fields_use_defaults(self):
        # Minimal job dict — only required-ish fields
        raw = {
            "jobId":   "1",
            "jobName": "Tester",
            "link":    {"job": "/job/1", "cust": ""},
        }
        job = parse_job(raw)
        assert job.job_name == "Tester"
        assert job.company_name == ""
        assert job.salary_low is None
        assert job.salary_high is None
        assert job.tags == []


# ---------------------------------------------------------------------------
# _parse_tags tests
# ---------------------------------------------------------------------------

class TestParseTags:
    def test_empty_list_returns_empty(self):
        assert _parse_tags([]) == []

    def test_name_key(self):
        assert _parse_tags([{"name": "Python"}]) == ["Python"]

    def test_label_key(self):
        assert _parse_tags([{"label": "React"}]) == ["React"]

    def test_desc_key(self):
        assert _parse_tags([{"desc": "Node.js"}]) == ["Node.js"]

    def test_desc_takes_priority_over_name(self):
        # desc is checked first in the updated code
        result = _parse_tags([{"desc": "First", "name": "Second"}])
        assert result == ["First"]

    def test_plain_string_tags(self):
        assert _parse_tags(["Python", "Django", "REST"]) == ["Python", "Django", "REST"]

    def test_mixed_dict_and_string_tags(self):
        raw = [{"name": "Docker"}, "Kubernetes"]
        assert _parse_tags(raw) == ["Docker", "Kubernetes"]

    def test_empty_string_tag_is_skipped(self):
        assert _parse_tags([""]) == []

    def test_dict_with_no_known_key_is_skipped(self):
        assert _parse_tags([{"unknown_key": "value"}]) == []

    def test_dict_with_empty_value_is_skipped(self):
        assert _parse_tags([{"name": ""}]) == []

    def test_non_string_tag_value_is_stringified(self):
        # Numeric values in tag dicts should be cast to str
        result = _parse_tags([{"name": 42}])
        assert result == ["42"]

    def test_multiple_tags(self):
        raw = [
            {"name": "Python"},
            {"name": "SQL"},
            {"label": "Docker"},
            "CI/CD",
        ]
        result = _parse_tags(raw)
        assert result == ["Python", "SQL", "Docker", "CI/CD"]


# ---------------------------------------------------------------------------
# _safe_int tests
# ---------------------------------------------------------------------------

class TestSafeInt:
    def test_positive_int(self):
        assert _safe_int(60000) == 60000

    def test_zero_returns_zero(self):
        # 0 is a valid integer — must NOT return None
        assert _safe_int(0) == 0

    def test_zero_string_returns_zero(self):
        assert _safe_int("0") == 0

    def test_none_returns_default(self):
        assert _safe_int(None) is None

    def test_none_with_custom_default(self):
        assert _safe_int(None, default=-1) == -1

    def test_empty_string_returns_default(self):
        # int("") raises ValueError
        assert _safe_int("") is None

    def test_string_number(self):
        assert _safe_int("12345") == 12345

    def test_non_numeric_string_returns_default(self):
        assert _safe_int("abc") is None

    def test_float_is_truncated_to_int(self):
        assert _safe_int(3.9) == 3

    def test_float_string_returns_default(self):
        # int("3.9") raises ValueError
        assert _safe_int("3.9") is None

    def test_negative_int(self):
        assert _safe_int(-5) == -5

    def test_bool_true_is_one(self):
        # bool is a subclass of int in Python
        assert _safe_int(True) == 1

    def test_bool_false_is_zero(self):
        assert _safe_int(False) == 0
