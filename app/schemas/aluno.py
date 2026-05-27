from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.common import ORM_MODEL_CONFIG
from app.schemas.pessoa import PessoaBaseSchema, PessoaResponseSchema


class AlunoBaseSchema(BaseModel):
    """Dados específicos da tabela ALUNO (resposta)."""

    RAaluno: int = Field(..., ge=1)
    matriculaAluno: str | None = Field(default=None, max_length=20)
    statusAluno: str = Field(..., min_length=1, max_length=20)


class AlunoCreateSchema(PessoaBaseSchema):
    """
    Criação de aluno: registros em PESSOA + ALUNO.

    pessoa_id, RAaluno e matriculaAluno são gerados pelo banco
    (IDENTITY / SEQUENCE / trigger) — não devem ser informados.
    """

    statusAluno: str = Field(..., min_length=1, max_length=20)
    senha: str = Field(..., min_length=6, max_length=100)


class AlunoUpdateSchema(BaseModel):
    """Atualização parcial — PESSOA e/ou ALUNO.

    RAaluno e matriculaAluno são imutáveis (gerados pelo banco).
    """

    nome: str | None = Field(default=None, min_length=1, max_length=100)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    dataNascimento: date | None = None
    endereco: str | None = Field(default=None, min_length=1, max_length=255)
    telefone: str | None = Field(default=None, min_length=1, max_length=15)
    statusAluno: str | None = Field(default=None, min_length=1, max_length=20)

    senha: str | None = Field(default=None, min_length=6, max_length=100)

    model_config = ConfigDict(extra="forbid")


class AlunoResponseSchema(PessoaResponseSchema, AlunoBaseSchema):
    """
    Resposta completa: PESSOA + ALUNO.

    Compatível com ORM quando `aluno.pessoa` estiver carregado (joinedload).
    """

    model_config = ORM_MODEL_CONFIG

    @model_validator(mode="before")
    @classmethod
    def flatten_aluno_orm(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data

        pessoa = getattr(data, "pessoa", None)
        if pessoa is None:
            return data

        return {
            "pessoa_id": data.pessoa_id,
            "RAaluno": data.RAaluno,
            "matriculaAluno": data.matriculaAluno,
            "statusAluno": data.statusAluno,
            "nome": pessoa.nome,
            "cpf": pessoa.cpf,
            "dataNascimento": pessoa.dataNascimento,
            "endereco": pessoa.endereco,
            "telefone": pessoa.telefone,
        }
