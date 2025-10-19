"""FastF1 cache configuration helpers."""

from __future__ import annotations

from pathlib import Path
from threading import Lock
from typing import Optional

import fastf1

_cache_lock = Lock()
_cache_path: Optional[Path] = None


def ensure_cache(cache_dir: str | Path | None = None) -> Path:
    """Enable the FastF1 on-disk cache (idempotent)."""

    global _cache_path
    path = Path(cache_dir or "./data/fastf1-cache").expanduser().resolve()

    with _cache_lock:
        if _cache_path is None:
            path.mkdir(parents=True, exist_ok=True)
            fastf1.Cache.enable_cache(str(path))
            _cache_path = path

    return _cache_path
