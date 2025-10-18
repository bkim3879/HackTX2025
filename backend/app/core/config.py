"Application configuration and settings helpers."

from functools import lru_cache
from typing import Any, Literal

from pydantic import Field, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class AppSettings(BaseSettings):
    """Central configuration loaded from the environment."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "RTSC+ Backend"
    app_env: Literal["dev", "prod", "test"] = Field(default="dev", alias="APP_ENV")
    api_v1_prefix: str = "/api/v1"
    redis_url: str = Field(default="redis://localhost:6379/0", alias="REDIS_URL")
    database_url: str = Field(
        default="sqlite+aiosqlite:///./rtsc.db", alias="DATABASE_URL"
    )
    risk_lambda: float = Field(default=0.3, alias="RISK_LAMBDA")
    model_version: str = Field(default="rtsc_1.0.3", alias="MODEL_VERSION")
    ws_recommendation_freq_hz: int = Field(
        default=1, alias="WS_RECO_FREQ_HZ", ge=1, le=10
    )
    telemetry_channel: str = "telemetry.updated"
    recommendation_channel: str = "recommendations.broadcast"
    decision_log_path: str | None = Field(
        default=None, alias="DECISION_LOG_PATH"
    )  # Allows overriding SQLite log path
    api_key: str | None = Field(default=None, alias="API_KEY")
    cors_allow_origins: list[str] = Field(
        default_factory=lambda: ["http://localhost:3000"], alias="CORS_ALLOWLIST"
    )
    telemetry_rate_limit_per_min: int = Field(default=120, alias="TELEMETRY_RATE_LIMIT")
    test_seed: int | None = Field(default=None, alias="RTSC_TEST_SEED")

    @validator("cors_allow_origins", pre=True)
    def _split_origins(cls, value: Any) -> list[str]:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value


@lru_cache
def get_settings() -> AppSettings:
    """Return cached settings instance."""
    return AppSettings()
