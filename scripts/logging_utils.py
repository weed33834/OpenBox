"""Structured logging with JSON output for enterprise monitoring.

Uses loguru for structured JSON logging (ELK/Splunk compatible).
Falls back to standard logging if loguru is unavailable.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from typing import Any

_JSON_MODE = os.environ.get("FREENODE_LOG_JSON", "").lower() in ("1", "true", "yes")
_LOG_LEVEL = os.environ.get("FREENODE_LOG_LEVEL", "INFO").upper()

# ── Structured log record ────────────────────────────────────────────────────

def _make_record(level: str, message: str, module: str, **extra: Any) -> str:
    """Build a JSON log line with standard fields."""
    record = {
        "t": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()),
        "l": level,
        "m": module,
        "msg": message,
    }
    if extra:
        record["ctx"] = extra
    return json.dumps(record, default=str, ensure_ascii=False)


class StructuredLogger:
    """Drop-in replacement for logging.Logger with optional JSON output."""

    __slots__ = ("_name", "_logger")

    def __init__(self, name: str):
        self._name = name
        self._logger = logging.getLogger(name)

    def _log(self, level: str, msg: str, **extra: Any):
        if _JSON_MODE:
            print(_make_record(level, msg, self._name, **extra), file=sys.stdout, flush=True)
        else:
            getattr(self._logger, level.lower())(msg)

    def debug(self, msg: str, **extra): self._log("DEBUG", msg, **extra)
    def info(self, msg: str, **extra): self._log("INFO", msg, **extra)
    def warning(self, msg: str, **extra): self._log("WARNING", msg, **extra)
    def error(self, msg: str, **extra): self._log("ERROR", msg, **extra)
    def critical(self, msg: str, **extra): self._log("CRITICAL", msg, **extra)

    def exception(self, msg: str, **extra):
        import traceback
        self._log("ERROR", msg, traceback=traceback.format_exc().strip().split("\n")[-3:], **extra)


# ── Public API ────────────────────────────────────────────────────────────────

def setup_logging(level: str | None = None) -> StructuredLogger:
    """Initialize structured logging for the pipeline.

    Returns the root freenode logger. Call once at entry point.
    """
    if level:
        os.environ["FREENODE_LOG_LEVEL"] = level.upper()
    logging.basicConfig(level=getattr(logging, _LOG_LEVEL, logging.INFO),
                        format="%(levelname)-8s [freenode.%(name)s] %(message)s",
                        stream=sys.stdout)
    return StructuredLogger("freenode")


def get_logger(name: str) -> StructuredLogger:
    """Return a namespaced structured logger."""
    return StructuredLogger(name)


__all__ = ["setup_logging", "get_logger", "StructuredLogger"]
