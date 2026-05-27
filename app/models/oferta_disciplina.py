from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.avaliacao import Avaliacao
    from app.models.cursamento import Cursamento
    from app.models.disciplina import Disciplina
    from app.models.professor import Professor
    from app.models.turma import Turma


class OfertaDisciplina(Base):
    __tablename__ = "OFERTADISCIPLINA"

    idOfertaDisciplina: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    anoLetivo: Mapped[int] = mapped_column(Integer, nullable=False)
    semestre: Mapped[int] = mapped_column(Integer, nullable=False)
    sala: Mapped[str] = mapped_column(String(10), nullable=False)
    diaOferta: Mapped[str] = mapped_column(String(255), nullable=False)
    mediaAprovacao: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    statusOferta: Mapped[str] = mapped_column(String(20), nullable=False)
    idDisciplina: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("DISCIPLINA.idDisciplina"),
        nullable=False,
    )
    idTurma: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("TURMA.idTurma"),
        nullable=False,
    )
    pessoa_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("PROFESSOR.pessoa_id"),
        nullable=False,
    )

    disciplina: Mapped[Disciplina] = relationship(back_populates="ofertas_disciplina")
    turma: Mapped[Turma] = relationship(back_populates="ofertas_disciplina")
    professor: Mapped[Professor] = relationship(back_populates="ofertas_disciplina")
    cursamentos: Mapped[list[Cursamento]] = relationship(back_populates="oferta_disciplina")
    avaliacoes: Mapped[list[Avaliacao]] = relationship(back_populates="oferta_disciplina")
