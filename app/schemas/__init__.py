from app.schemas.aluno import (
    AlunoCreateSchema,
    AlunoResponseSchema,
    AlunoUpdateSchema,
)
from app.schemas.pessoa import PessoaBaseSchema, PessoaResponseSchema

__all__ = [
    "PessoaBaseSchema",
    "PessoaResponseSchema",
    "AlunoCreateSchema",
    "AlunoUpdateSchema",
    "AlunoResponseSchema",
]
