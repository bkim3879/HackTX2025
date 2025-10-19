"Logging setup utilities for the RTSC+ backend."

from __future__ import annotations

import logging
import sys
from typing import Any

import structlog


def configure_logging(level: int = logging.INFO) -> None:
    """Configure structured logging for the service."""

    timestamper = structlog.processors.TimeStamper(fmt="iso")
    pre_chain: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        timestamper,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
    ]

    structlog.configure(
        processors=pre_chain
        + [
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            processor=structlog.processors.JSONRenderer(serializer=_fast_serializer),
            foreign_pre_chain=pre_chain,
        )
    )

    root_logger = logging.getLogger()
    root_logger.handlers.clear()
    root_logger.setLevel(level)
    root_logger.addHandler(handler)


def _fast_serializer(event_dict: dict[str, Any], **kwargs: Any) -> str:
    """Serialize log events via orjson when available."""
    default = kwargs.get("default")
    try:
        import orjson

        if default is not None:
            return orjson.dumps(event_dict, default=default).decode()
        return orjson.dumps(event_dict).decode()
    except ImportError:  # pragma: no cover - fallback path
        import json

        return json.dumps(event_dict, default=default)
