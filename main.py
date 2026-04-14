"""
JobInsight-104 — 104.com.tw job scraper CLI.

Usage:
    python main.py --keyword Python --area taipei
    python main.py -k "數據分析" -a taipei,new_taipei --order date -n 5
    python main.py -k "後端工程師" -a taipei -v --max-pages 10
"""

import argparse
import logging
import os
import sys
from datetime import datetime

import config
from scraper import JobClient, Scraper, ScraperError
from storage import write_csv, write_json


def parse_args(argv=None):
    parser = argparse.ArgumentParser(
        prog="jobinsight-104",
        description="Scrape job listings from 104.com.tw",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )

    # Search parameters
    search = parser.add_argument_group("Search")
    search.add_argument(
        "--keyword", "-k",
        default="",
        help="Search keyword (e.g. Python, 數據分析)",
    )
    search.add_argument(
        "--area", "-a",
        default="taipei",
        help=(
            "Comma-separated area names or raw codes. "
            f"Known names: {', '.join(config.AREA_CODES.keys())}"
        ),
    )
    search.add_argument(
        "--order",
        default="relevance",
        choices=list(config.ORDER_CODES.keys()),
        help="Sort order (default: relevance)",
    )
    search.add_argument(
        "--max-pages", "-n",
        type=int,
        default=None,
        metavar="N",
        help="Maximum pages to scrape (default: all)",
    )
    search.add_argument(
        "--pagesize",
        type=int,
        default=20,
        choices=range(1, 21),
        metavar="1-20",
        help="Results per page (default: 20, max: 20)",
    )

    # Output
    output = parser.add_argument_group("Output")
    output.add_argument(
        "--output-dir", "-o",
        default=config.OUTPUT_DIR,
        help=f"Output directory (default: {config.OUTPUT_DIR})",
    )
    output.add_argument(
        "--format",
        default="both",
        choices=["csv", "json", "both"],
        help="Output format (default: both)",
    )
    output.add_argument(
        "--filename-prefix", "-p",
        default="jobs",
        help="Filename prefix (default: jobs)",
    )

    # Behavior
    behavior = parser.add_argument_group("Behavior")
    behavior.add_argument(
        "--min-delay",
        type=float,
        default=config.MIN_DELAY_SECONDS,
        help=f"Min delay between requests in seconds (default: {config.MIN_DELAY_SECONDS})",
    )
    behavior.add_argument(
        "--max-delay",
        type=float,
        default=config.MAX_DELAY_SECONDS,
        help=f"Max delay between requests in seconds (default: {config.MAX_DELAY_SECONDS})",
    )
    behavior.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable DEBUG logging",
    )

    return parser.parse_args(argv)


def resolve_area_codes(area_str: str) -> str:
    """Convert area name(s) to 104 area code string."""
    parts = [p.strip() for p in area_str.split(",") if p.strip()]
    codes = []
    for part in parts:
        if part in config.AREA_CODES:
            codes.append(config.AREA_CODES[part])
        else:
            # Assume it's already a raw code
            codes.append(part)
    return ",".join(codes)


def main(argv=None):
    args = parse_args(argv)

    log_level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )
    logger = logging.getLogger("main")

    # Build search params
    area_codes = resolve_area_codes(args.area)
    params = {
        **config.DEFAULT_PARAMS,
        "order":    config.ORDER_CODES[args.order],
        "pagesize": str(args.pagesize),
        "area":     area_codes,
    }
    if args.keyword:
        params["keyword"] = args.keyword

    logger.info("Search params: %s", params)

    # Resolve output paths
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    prefix = args.filename_prefix
    csv_path  = os.path.join(args.output_dir, f"{prefix}_{ts}.csv")
    json_path = os.path.join(args.output_dir, f"{prefix}_{ts}.json")

    # Scrape
    try:
        with JobClient(
            min_delay=args.min_delay,
            max_delay=args.max_delay,
        ) as client:
            scraper = Scraper(client)
            jobs = scraper.scrape(params, max_pages=args.max_pages)
    except ScraperError as exc:
        logger.error("Scraping failed: %s", exc)
        sys.exit(1)

    if not jobs:
        logger.warning("No jobs found. Check your search parameters.")
        sys.exit(0)

    logger.info("Collected %d job listings total.", len(jobs))

    # Write output
    search_meta = {
        "keyword":  args.keyword,
        "area":     args.area,
        "order":    args.order,
        "max_pages": args.max_pages,
    }

    saved_paths = []
    if args.format in ("csv", "both"):
        write_csv(jobs, csv_path)
        saved_paths.append(csv_path)
    if args.format in ("json", "both"):
        write_json(jobs, json_path, metadata=search_meta)
        saved_paths.append(json_path)

    print(f"\nSaved {len(jobs)} jobs to:")
    for p in saved_paths:
        print(f"  {os.path.abspath(p)}")


if __name__ == "__main__":
    main()
