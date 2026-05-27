from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORM_MODEL_CONFIG


class OfertaDisciplinaBaseSchema(BaseModel):
    """Dados específicos da tabela OFERTADISCIPLINA."""

    anoLetivo: int = Field(..., ge=2000, le=2100)
    semestre: int = Field(..., ge=1, le=2)
    sala: str = Field(..., min_length=1, max_length=10)
    diaOferta: str = Field(..., min_length=1, max_length=255)
    mediaAprovacao: Decimal = Field(..., ge=0, le=10)
    statusOferta: str = Field(..., min_length=1, max_length=20)

    idDisciplina: int = Field(..., ge=1)
    idTurma: int = Field(..., ge=1)
    pessoa_id: int = Field(..., ge=1, description="Professor responsável")


class OfertaDisciplinaCreateSchema(OfertaDisciplinaBaseSchema):
    """Criação de OFERTADISCIPLINA. idOfertaDisciplina é gerado pelo banco (IDENTITY)."""


class OfertaDisciplinaUpdateSchema(BaseModel):
    """Atualização parcial de OFERTADISCIPLINA."""

    anoLetivo: int | None = Field(default=None, ge=2000, le=2100)
    semestre: int | None = Field(default=None, ge=1, le=2)
    sala: str | None = Field(default=None, min_length=1, max_length=10)
    diaOferta: str | None = Field(default=None, min_length=1, max_length=255)
    mediaAprovacao: Decimal | None = Field(default=None, ge=0, le=10)
    statusOferta: str | None = Field(default=None, min_length=1, max_length=20)

    idDisciplina: int | None = Field(default=None, ge=1)
    idTurma: int | None = Field(default=None, ge=1)
    pessoa_id: int | None = Field(default=None, ge=1)

    model_config = ConfigDict(extra="forbid")


class OfertaDisciplinaResponseSchema(OfertaDisciplinaBaseSchema):
    """Resposta completa da OFERTADISCIPLINA."""

    idOfertaDisciplina: int

    model_config = ORM_MODEL_CONFIG
