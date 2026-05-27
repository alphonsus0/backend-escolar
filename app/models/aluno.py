from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.matricula import Matricula
    from app.models.pessoa import Pessoa


class Aluno(Base):
    __tablename__ = "ALUNO"

    pessoa_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("PESSOA.pessoa_id"),
        primary_key=True,
        autoincrement=False,
    )
    RAaluno: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    matriculaAluno: Mapped[str | None] = mapped_column(String(20), nullable=True)
    statusAluno: Mapped[str] = mapped_column(String(20), nullable=False)

    pessoa: Mapped[Pessoa] = relationship(back_populates="aluno")
    senha: Mapped[str] = mapped_column(String(255), nullable=False)
    matriculas: Mapped[list[Matricula]] = relationship(back_populates="aluno")
