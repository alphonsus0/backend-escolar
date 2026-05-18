from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, ForeignKeyConstraint, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.matricula import Matricula
    from app.models.nota import Nota
    from app.models.oferta_disciplina import OfertaDisciplina


class Cursamento(Base):
    __tablename__ = "CURSAMENTO"

    siMatricula: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("MATRICULA.idMatricula"),
        primary_key=True,
        autoincrement=False,
    )
    idOfertaDisciplina: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("OFERTADISCIPLINA.idOfertaDisciplina"),
        primary_key=True,
        autoincrement=False,
    )
    mediaFinal: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    faltas: Mapped[int] = mapped_column(Integer, nullable=False)
    situacaoFinal: Mapped[str] = mapped_column(String(20), nullable=False)
    obs: Mapped[str | None] = mapped_column(String(255), nullable=True)

    matricula: Mapped[Matricula] = relationship(back_populates="cursamentos")
    oferta_disciplina: Mapped[OfertaDisciplina] = relationship(
        back_populates="cursamentos",
    )
    notas: Mapped[list[Nota]] = relationship(
        back_populates="cursamento",
        primaryjoin=(
            "and_(Cursamento.siMatricula == Nota.siMatricula, "
            "Cursamento.idOfertaDisciplina == Nota.idOfertaDisciplina)"
        ),
        foreign_keys="[Nota.siMatricula, Nota.idOfertaDisciplina]",
    )
