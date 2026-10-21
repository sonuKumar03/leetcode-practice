from contextlib import contextmanager
from typing import Generator

from alembic import command
from alembic.config import Config
from sqlalchemy.orm import Session

from app.db.engine import SessionLocal, engine
from app.db.models import Base

_ALEMBIC_INI = "alembic.ini"


def init_db() -> None:
    Base.metadata.create_all(bind=engine)
    cfg = Config(_ALEMBIC_INI)
    command.stamp(cfg, "head")


def run_migrations() -> None:
    from alembic.migration import MigrationContext
    from sqlalchemy import inspect
    with engine.connect() as conn:
        ctx = MigrationContext.configure(conn)
        current_rev = ctx.get_current_revision()
    cfg = Config(_ALEMBIC_INI)
    if current_rev is None:
        inspector = inspect(engine)
        if inspector.has_table("users"):
            command.stamp(cfg, "001_baseline")
    command.upgrade(cfg, "head")


@contextmanager
def get_db() -> Generator[Session, None, None]:
    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


get_db_connection = get_db
