"Basic API key dependency helpers."

from fastapi import Depends, HTTPException, Security, status
from fastapi.security import APIKeyHeader

from .config import get_settings

_api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)


async def require_api_key(api_key: str | None = Security(_api_key_header)) -> None:
    """Validate the provided API key when configured."""
    settings = get_settings()
    if settings.api_key is None:
        return
    if api_key != settings.api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )


def optional_api_key(api_key: str | None = Security(_api_key_header)) -> str | None:
    """Expose the configured API key (if present)."""
    return api_key
