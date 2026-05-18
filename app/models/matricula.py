from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.aluno import Aluno
    from app.models.cursamento import Cursamento
    from app.models.turma import Turma


class Matricula(Base):
    __tablename__ = "MATRICULA"

    idMatricula: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    anoLetivo: Mapped[int] = mapped_column(Integer, nullable=False)
    semestre: Mapped[int] = mapped_column(Integer, nullable=False)
    dataMatricula: Mapped[date] = mapped_column(Date, nullable=False)
    statusMatricula: Mapped[str] = mapped_column(String(20), nullable=False)
    pessoa_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("ALUNO.pessoa_id"),
        nullable=False,
    )
    idTurma: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("TURMA.idTurma"),
        nullable=False,
    )

    aluno: Mapped[Aluno] = relationship(back_populates="matriculas")
    turma: Mapped[Turma] = relationship(back_populates="matriculas")
    cursamentos: Mapped[list[Cursamento]] = relationship(back_populates="matricula")
