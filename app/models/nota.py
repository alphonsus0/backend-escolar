from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, ForeignKeyConstraint, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.avaliacao import Avaliacao
    from app.models.cursamento import Cursamento


class Nota(Base):
    __tablename__ = "NOTA"
    __table_args__ = (
        ForeignKeyConstraint(
            ["siMatricula", "idOfertaDisciplina"],
            [
                "CURSAMENTO.siMatricula",
                "CURSAMENTO.idOfertaDisciplina",
            ],
        ),
    )

    idNota: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nota: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    siMatricula: Mapped[int] = mapped_column(Integer, nullable=False)
    idOfertaDisciplina: Mapped[int] = mapped_column(Integer, nullable=False)
    idAvaliacao: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("AVALIACAO.idAvaliacao"),
        nullable=False,
    )

    cursamento: Mapped[Cursamento] = relationship(
        back_populates="notas",
        primaryjoin=(
            "and_(Cursamento.siMatricula == foreign(Nota.siMatricula), "
            "Cursamento.idOfertaDisciplina == foreign(Nota.idOfertaDisciplina))"
        ),
        foreign_keys="[Nota.siMatricula, Nota.idOfertaDisciplina]",
    )
    avaliacao: Mapped[Avaliacao] = relationship(back_populates="notas")
