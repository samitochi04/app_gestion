"""Helpers shared by the suites: date windows and unique fixture labels."""

from __future__ import annotations

import time
from datetime import date, timedelta

#: Suffix stamped on everything the write mode creates, so test rows stay
#: recognisable in the database.
RUN_TAG = f"APITEST-{time.strftime('%Y%m%d-%H%M%S')}"


def tag(prefix: str) -> str:
    return f"{prefix} {RUN_TAG}"


def today() -> str:
    return date.today().isoformat()


def year_start() -> str:
    return date(date.today().year, 1, 1).isoformat()


def days_ahead(n: int) -> str:
    return (date.today() + timedelta(days=n)).isoformat()


def month_bounds(year: int, month: int) -> tuple[str, str]:
    start = date(year, month, 1)
    end = date(year + (month == 12), (month % 12) + 1, 1) - timedelta(days=1)
    return start.isoformat(), end.isoformat()
