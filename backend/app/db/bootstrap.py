
from sqlalchemy import func, select

from app.db import models  # noqa: F401 - register all ORM models
from app.db.base import Base
from app.db.init_db import init_db
from app.db.seed import seed_database
from app.db.session import SessionLocal


def database_is_empty() -> bool:
    """Return True only when every registered table contains no rows."""
    with SessionLocal() as session:
        for table in Base.metadata.sorted_tables:
            count = session.scalar(select(func.count()).select_from(table))
            if count:
                return False
    return True


def bootstrap_database() -> None:
    """Create tables and seed demo data only when the database is empty."""
    init_db()

    if database_is_empty():
        counts = seed_database()
        print(f"Empty database seeded successfully: {counts}")
    else:
        print("Database already contains data; skipping seed.")


if __name__ == "__main__":
    bootstrap_database()
