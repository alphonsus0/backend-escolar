from fastapi import APIRouter, HTTPException, status
from sqlalchemy import text

from app.core.config import settings
from app.core.database import get_engine

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    return {"status": "ok", "project": settings.PROJECT_NAME}


@router.get("/health/db")
def health_db():
    engine = get_engine()
    if engine is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="DATABASE_URL não configurada",
        )
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    return {"status": "ok", "database": "connected"}
