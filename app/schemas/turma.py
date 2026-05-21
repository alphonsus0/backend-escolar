from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORM_MODEL_CONFIG


class TurmaBaseSchema(BaseModel):
    """Dados da tabela TURMA."""

    nomeTurma: str = Field(..., min_length=1, max_length=100)
    turno: str = Field(..., min_length=1, max_length=20)
    serie: str = Field(..., min_length=1, max_length=20)
    salasTurma: str = Field(..., min_length=1, max_length=20)
    anoLetivo: int = Field(..., ge=2000)


class TurmaCreateSchema(TurmaBaseSchema):
    """Criação de turma."""

    idTurma: int = Field(..., ge=1)


class TurmaUpdateSchema(BaseModel):
    """Atualização parcial."""

    nomeTurma: str | None = Field(default=None, min_length=1, max_length=100)
    turno: str | None = Field(default=None, min_length=1, max_length=20)
    serie: str | None = Field(default=None, min_length=1, max_length=20)
    salasTurma: str | None = Field(default=None, min_length=1, max_length=20)
    anoLetivo: int | None = Field(default=None, ge=2000)

    model_config = ConfigDict(extra="forbid")


class TurmaResponseSchema(TurmaBaseSchema):
    """Resposta da API."""

    model_config = ORM_MODEL_CONFIG

    idTurma: int
