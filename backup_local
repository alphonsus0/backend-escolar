from datetime import date
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.common import ORM_MODEL_CONFIG
from app.schemas.pessoa import PessoaBaseSchema, PessoaResponseSchema


class ProfessorBaseSchema(BaseModel):
    """Dados específicos da tabela PROFESSOR."""

    idProfessor: int = Field(..., ge=1)
    matriculaProf: str = Field(..., min_length=1, max_length=20)
    prof_Formacao: str = Field(..., min_length=1, max_length=100)
    dataAdmissao: date


class ProfessorCreateSchema(PessoaBaseSchema, ProfessorBaseSchema):
    """
    Criação de professor: registros em PESSOA + PROFESSOR (mesmo pessoa_id).

    Não inclui campos de autenticação (senha, hash, token).
    """

    pessoa_id: int = Field(..., ge=1, description="Chave compartilhada PESSOA/PROFESSOR")


class ProfessorUpdateSchema(BaseModel):
    """Atualização parcial — PESSOA e/ou PROFESSOR."""

    nome: str | None = Field(default=None, min_length=1, max_length=100)
    cpf: str | None = Field(default=None, min_length=11, max_length=14)
    dataNascimento: date | None = None
    endereco: str | None = Field(default=None, min_length=1, max_length=255)
    telefone: str | None = Field(default=None, min_length=1, max_length=15)
    idProfessor: int | None = Field(default=None, ge=1)
    matriculaProf: str | None = Field(default=None, min_length=1, max_length=20)
    prof_Formacao: str | None = Field(default=None, min_length=1, max_length=100)
    dataAdmissao: date | None = None

    model_config = ConfigDict(extra="forbid")


class ProfessorResponseSchema(PessoaResponseSchema, ProfessorBaseSchema):
    """
    Resposta completa: PESSOA + PROFESSOR.

    Compatível com ORM quando `professor.pessoa` estiver carregado (joinedload).
    """

    model_config = ORM_MODEL_CONFIG

    @model_validator(mode="before")
    @classmethod
    def flatten_professor_orm(cls, data: Any) -> Any:
        if isinstance(data, dict):
            return data

        pessoa = getattr(data, "pessoa", None)
        if pessoa is None:
            return data

        return {
            "pessoa_id": data.pessoa_id,
            "idProfessor": data.idProfessor,
            "matriculaProf": data.matriculaProf,
            "prof_Formacao": data.prof_Formacao,
            "dataAdmissao": data.dataAdmissao,
            "nome": pessoa.nome,
            "cpf": pessoa.cpf,
            "dataNascimento": pessoa.dataNascimento,
            "endereco": pessoa.endereco,
            "telefone": pessoa.telefone,
        }
