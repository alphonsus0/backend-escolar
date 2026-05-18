from datetime import date

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORM_MODEL_CONFIG

# Campos de PESSOA — sem credenciais/senha (autenticação ficará em schemas dedicados).


class PessoaBaseSchema(BaseModel):
    """Dados cadastrais compartilhados da tabela PESSOA."""

    nome: str = Field(..., min_length=1, max_length=100)
    cpf: str = Field(..., min_length=11, max_length=14)
    dataNascimento: date
    endereco: str = Field(..., min_length=1, max_length=255)
    telefone: str = Field(..., min_length=1, max_length=15)


class PessoaResponseSchema(PessoaBaseSchema):
    """PESSOA para respostas da API."""

    pessoa_id: int = Field(..., ge=1)

    model_config = ORM_MODEL_CONFIG
