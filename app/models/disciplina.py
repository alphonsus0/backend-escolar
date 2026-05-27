from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.oferta_disciplina import OfertaDisciplina


class Disciplina(Base):
    __tablename__ = "DISCIPLINA"

    idDisciplina: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    nomeDisciplina: Mapped[str] = mapped_column(String(100), nullable=False)
    cargaHoraria: Mapped[int] = mapped_column(Integer, nullable=False)
    statusDisciplina: Mapped[str] = mapped_column(String(20), nullable=False)

    ofertas_disciplina: Mapped[list[OfertaDisciplina]] = relationship(
        back_populates="disciplina",
    )
