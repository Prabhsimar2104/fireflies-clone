from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {},
)


if engine.url.drivername.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(dbapi_connection: object, connection_record: object) -> None:
        """Enable SQLite foreign-key constraint enforcement for every connection."""
        del connection_record
        cursor = dbapi_connection.cursor()  # type: ignore[attr-defined]
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
