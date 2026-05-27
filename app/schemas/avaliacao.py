from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORM_MODEL_CONFIG


class AvaliacaoBaseSchema(BaseModel):
    """Dados da tabela AVALIACAO."""

    peso: Decimal = Field(..., gt=0, le=10)
    nomeAvaliacao: str = Field(..., min_length=1, max_length=100)
    dataAvaliacao: date
    tipoAvaliacao: str = Field(..., min_length=1, max_length=50)
    descAvaliacao: str | None = Field(default=None, max_length=255)


class AvaliacaoCreateSchema(AvaliacaoBaseSchema):
    """Criação de avaliação. idAvaliacao é gerado pelo banco (IDENTITY)."""

    idOfertaDisciplina: int = Field(..., ge=1)


class AvaliacaoUpdateSchema(BaseModel):
    """Atualização parcial."""

    peso: Decimal | None = Field(default=None, gt=0, le=10)
    nomeAvaliacao: str | None = Field(default=None, min_length=1, max_length=100)
    dataAvaliacao: date | None = None
    tipoAvaliacao: str | None = Field(default=None, min_length=1, max_length=50)
    descAvaliacao: str | None = Field(default=None, max_length=255)

    model_config = ConfigDict(extra="forbid")


class AvaliacaoResponseSchema(AvaliacaoBaseSchema):
    """Resposta completa."""

    idAvaliacao: int
    idOfertaDisciplina: int

    model_config = ORM_MODEL_CONFIG
