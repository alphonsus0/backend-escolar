from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.matricula import Matricula
    from app.models.oferta_disciplina import OfertaDisciplina


class Turma(Base):
    __tablename__ = "TURMA"

    idTurma: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    nomeTurma: Mapped[str] = mapped_column(String(100), nullable=False)
    turno: Mapped[str] = mapped_column(String(20), nullable=False)
    serie: Mapped[str] = mapped_column(String(20), nullable=False)
    salasTurma: Mapped[str] = mapped_column(String(20), nullable=False)
    anoLetivo: Mapped[int] = mapped_column(Integer, nullable=False)

    matriculas: Mapped[list[Matricula]] = relationship(back_populates="turma")
    ofertas_disciplina: Mapped[list[OfertaDisciplina]] = relationship(
        back_populates="turma",
    )
