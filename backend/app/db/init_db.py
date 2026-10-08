from pathlib import Path

from app.db import models  # noqa: F401 - registers ORM models with Base metadata
from app.db.base import Base
from app.db.session import engine


def init_db() -> None:
    """Create the local SQLite database and all ORM tables if they do not exist."""
    if engine.url.drivername.startswith("sqlite") and engine.url.database not in (None, ":memory:"):
        Path(engine.url.database).parent.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(bind=engine)


if __name__ == "__main__":
    init_db()
    print(f"Database initialized at: {engine.url}")
