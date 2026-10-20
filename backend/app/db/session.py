from contextlib import contextmanager
from typing import Generator

from sqlalchemy.orm import Session

from app.db.engine import SessionLocal, engine
from app.db.models import Base


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


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
