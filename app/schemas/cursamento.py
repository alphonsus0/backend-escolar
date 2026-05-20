from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORM_MODEL_CONFIG


class CursamentoBaseSchema(BaseModel):
    """Dados da tabela CURSAMENTO."""

    mediaFinal: Decimal = Field(..., ge=0, le=10)
    faltas: int = Field(..., ge=0)
    situacaoFinal: str = Field(..., min_length=1, max_length=20)
    obs: str | None = Field(default=None, max_length=255)


class CursamentoCreateSchema(CursamentoBaseSchema):
    """Criação de CURSAMENTO."""

    siMatricula: int = Field(..., ge=1)
    idOfertaDisciplina: int = Field(..., ge=1)


class CursamentoUpdateSchema(BaseModel):
    """Atualização parcial."""

    mediaFinal: Decimal | None = Field(default=None, ge=0, le=10)
    faltas: int | None = Field(default=None, ge=0)
    situacaoFinal: str | None = Field(default=None, min_length=1, max_length=20)
    obs: str | None = Field(default=None, max_length=255)

    model_config = ConfigDict(extra="forbid")


class CursamentoResponseSchema(CursamentoBaseSchema):
    """Resposta completa."""

    siMatricula: int
    idOfertaDisciplina: int

    model_config = ORM_MODEL_CONFIG
