from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORM_MODEL_CONFIG


class DisciplinaBaseSchema(BaseModel):
    """Dados da tabela DISCIPLINA."""

    nomeDisciplina: str = Field(..., min_length=1, max_length=100)
    cargaHoraria: int = Field(..., ge=1)
    statusDisciplina: str = Field(..., min_length=1, max_length=20)


class DisciplinaCreateSchema(DisciplinaBaseSchema):
    """Criação de disciplina."""

    idDisciplina: int = Field(..., ge=1)


class DisciplinaUpdateSchema(BaseModel):
    """Atualização parcial de DISCIPLINA."""

    nomeDisciplina: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    cargaHoraria: int | None = Field(
        default=None,
        ge=1,
    )

    statusDisciplina: str | None = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    model_config = ConfigDict(extra="forbid")


class DisciplinaResponseSchema(DisciplinaBaseSchema):
    """Resposta da API para DISCIPLINA."""

    idDisciplina: int

    model_config = ORM_MODEL_CONFIG
