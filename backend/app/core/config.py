import os
from dataclasses import dataclass
from pathlib import Path


BACKEND_DIR = Path(__file__).resolve().parents[2]
DEFAULT_DATABASE_PATH = BACKEND_DIR / "data" / "fireflies_clone.db"


def _cors_origins() -> tuple[str, ...]:
    """Read a comma-separated development CORS origin list from the environment."""
    raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000")
    return tuple(origin.strip() for origin in raw_origins.split(",") if origin.strip())


@dataclass(frozen=True)
class Settings:
    database_url: str
    cors_origins: tuple[str, ...]


settings = Settings(
    database_url=os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DATABASE_PATH.as_posix()}"),
    cors_origins=_cors_origins(),
)
