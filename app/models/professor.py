from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.oferta_disciplina import OfertaDisciplina
    from app.models.pessoa import Pessoa


class Professor(Base):
    __tablename__ = "PROFESSOR"

    pessoa_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("PESSOA.pessoa_id"),
        primary_key=True,
        autoincrement=False,
    )
    idProfessor: Mapped[int] = mapped_column(Integer, nullable=False, unique=True)
    matriculaProf: Mapped[str] = mapped_column(String(20), nullable=False)
    prof_Formacao: Mapped[str] = mapped_column(String(100), nullable=False)
    dataAdmissao: Mapped[date] = mapped_column(Date, nullable=False)

    pessoa: Mapped[Pessoa] = relationship(back_populates="professor")
    ofertas_disciplina: Mapped[list[OfertaDisciplina]] = relationship(
        back_populates="professor",
    )
