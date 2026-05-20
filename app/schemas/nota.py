from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORM_MODEL_CONFIG


class NotaBaseSchema(BaseModel):
    """Dados da tabela NOTA."""

    notaValor: Decimal = Field(..., ge=0, le=10)


class NotaCreateSchema(NotaBaseSchema):
    """Criação de NOTA."""

    idNota: int = Field(..., ge=1)
    siMatricula: int = Field(..., ge=1)
    idOfertaDisciplina: int = Field(..., ge=1)


class NotaUpdateSchema(BaseModel):
    """Atualização parcial."""

    notaValor: Decimal | None = Field(default=None, ge=0, le=10)

    model_config = ConfigDict(extra="forbid")


class NotaResponseSchema(NotaBaseSchema):
    """Resposta completa."""

    idNota: int
    siMatricula: int
    idOfertaDisciplina: int

    model_config = ORM_MODEL_CONFIG
