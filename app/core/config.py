import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Garante leitura do .env na raiz do projeto, mesmo se o uvicorn iniciar de outra pasta.
BASE_DIR = Path(__file__).resolve().parents[2]
load_dotenv(BASE_DIR / ".env")


class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Sistema Acadêmico Escolar")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() in ("1", "true", "yes")

    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")

    DATABASE_URL: str = os.getenv("DATABASE_URL", "").strip()

    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    CORS_ORIGINS: list[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5500").split(",")
        if origin.strip()
    ]

    @property
    def database_configured(self) -> bool:
        return bool(self.DATABASE_URL)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
