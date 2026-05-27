from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import Date, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.nota import Nota
    from app.models.oferta_disciplina import OfertaDisciplina


class Avaliacao(Base):
    __tablename__ = "AVALIACAO"

    idAvaliacao: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    peso: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    nomeAvaliacao: Mapped[str] = mapped_column(String(100), nullable=False)
    dataAvaliacao: Mapped[date] = mapped_column(Date, nullable=False)
    tipoAvaliacao: Mapped[str] = mapped_column(String(50), nullable=False)
    descAvaliacao: Mapped[str | None] = mapped_column(String(255), nullable=True)
    idOfertaDisciplina: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("OFERTADISCIPLINA.idOfertaDisciplina"),
        nullable=False,
    )

    oferta_disciplina: Mapped[OfertaDisciplina] = relationship(
        back_populates="avaliacoes",
    )
    notas: Mapped[list[Nota]] = relationship(back_populates="avaliacao")
