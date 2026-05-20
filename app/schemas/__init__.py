from app.schemas.aluno import (
    AlunoCreateSchema,
    AlunoResponseSchema,
    AlunoUpdateSchema,
)
from app.schemas.pessoa import PessoaBaseSchema, PessoaResponseSchema
from app.schemas.professor import (
    ProfessorCreateSchema,
    ProfessorResponseSchema,
    ProfessorUpdateSchema,
)

__all__ = [
    "PessoaBaseSchema",
    "PessoaResponseSchema",
    "AlunoCreateSchema",
    "AlunoUpdateSchema",
    "AlunoResponseSchema",
    "ProfessorCreateSchema",
    "ProfessorUpdateSchema",
    "ProfessorResponseSchema",
]
