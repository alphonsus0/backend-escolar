from collections.abc import Generator
from functools import lru_cache

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from app.core.config import settings
from app.exceptions import DatabaseConfigError

# Base apenas para declarar models que espelham tabelas existentes.
# Não usar create_all — o banco já existe.
Base = declarative_base()


@lru_cache
def get_engine() -> Engine | None:
    if not settings.database_configured:
        return None
    return create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        echo=settings.DEBUG,
    )


@lru_cache
def get_session_factory() -> sessionmaker[Session] | None:
    engine = get_engine()
    if engine is None:
        return None
    return sessionmaker(autocommit=False, autoflush=False, bind=engine)


def SessionLocal() -> Session:
    """
    Abre uma sessão ORM (sessionmaker).

    Preferir injeção via `get_db()` nos endpoints FastAPI.
    """
    session_factory = get_session_factory()
    if session_factory is None:
        raise DatabaseConfigError()
    return session_factory()


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
