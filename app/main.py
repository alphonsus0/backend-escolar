from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from app.api.v1.router import api_router
from app.core.config import settings
from app.exceptions import AppError


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Banco já existe — sem create_all, migrations ou Alembic.
    if settings.database_configured:
        print(f"[OK] DATABASE_URL configurada (banco: {_database_name()})")
    else:
        print(
            "[AVISO] DATABASE_URL não configurada — endpoints /alunos retornarão 503. "
            "Copie .env.example para .env e reinicie o servidor."
        )
    yield


def _database_name() -> str:
    url = settings.DATABASE_URL
    if "/" not in url:
        return "?"
    segment = url.split("/", 3)[-1]
    return segment.split("?")[0] or "?"


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_error_handler(_request: Request, exc: SQLAlchemyError) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={"detail": "Erro ao acessar o banco de dados", "error": str(exc.orig) if exc.orig else str(exc)},
    )


@app.get("/")
def root():
    return {
        "message": settings.PROJECT_NAME,
        "docs": "/docs",
        "api": settings.API_V1_PREFIX,
    }
