from app.models.aluno import Aluno
from app.models.avaliacao import Avaliacao
from app.models.base import Base
from app.models.cursamento import Cursamento
from app.models.disciplina import Disciplina
from app.models.matricula import Matricula
from app.models.nota import Nota
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.pessoa import Pessoa
from app.models.professor import Professor
from app.models.turma import Turma

__all__ = [
    "Base",
    "Pessoa",
    "Aluno",
    "Professor",
    "Turma",
    "Disciplina",
    "Matricula",
    "OfertaDisciplina",
    "Cursamento",
    "Nota",
    "Avaliacao",
]
