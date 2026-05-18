from __future__ import annotations

from datetime import date
from typing import TYPE_CHECKING

from sqlalchemy import Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.aluno import Aluno
    from app.models.professor import Professor


class Pessoa(Base):
    __tablename__ = "PESSOA"

    pessoa_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    nome: Mapped[str] = mapped_column(String(100), nullable=False)
    cpf: Mapped[str] = mapped_column(String(14), nullable=False, unique=True)
    dataNascimento: Mapped[date] = mapped_column(Date, nullable=False)
    endereco: Mapped[str] = mapped_column(String(255), nullable=False)
    telefone: Mapped[str] = mapped_column(String(15), nullable=False)

    aluno: Mapped[Aluno | None] = relationship(back_populates="pessoa", uselist=False)
    professor: Mapped[Professor | None] = relationship(
        back_populates="pessoa",
        uselist=False,
    )
