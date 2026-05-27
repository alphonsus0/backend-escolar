from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORM_MODEL_CONFIG


class MatriculaBaseSchema(BaseModel):
    """Dados da tabela MATRICULA."""

    anoLetivo: int = Field(..., ge=2000, le=2100)
    semestre: int = Field(..., ge=1, le=2)
    dataMatricula: date
    statusMatricula: str = Field(..., min_length=1, max_length=20)


class MatriculaCreateSchema(MatriculaBaseSchema):
    """Criação de matrícula. idMatricula é gerado pelo banco (IDENTITY)."""

    pessoa_id: int = Field(..., ge=1)
    idTurma: int = Field(..., ge=1)


class MatriculaUpdateSchema(BaseModel):
    """Atualização parcial de matrícula."""

    anoLetivo: int | None = Field(
        default=None,
        ge=2000,
        le=2100,
    )

    semestre: int | None = Field(
        default=None,
        ge=1,
        le=2,
    )

    dataMatricula: date | None = None

    statusMatricula: str | None = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    pessoa_id: int | None = Field(
        default=None,
        ge=1,
    )

    idTurma: int | None = Field(
        default=None,
        ge=1,
    )

    model_config = ConfigDict(extra="forbid")


class MatriculaResponseSchema(MatriculaBaseSchema):
    """Resposta da API para MATRICULA."""

    idMatricula: int
    pessoa_id: int
    idTurma: int

    model_config = ORM_MODEL_CONFIG
