from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.cursamento import Cursamento
from app.models.nota import Nota
from app.schemas.nota import (
    NotaCreateSchema,
    NotaUpdateSchema,
)


class NotaService:
    """Operações de negócio da entidade NOTA."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Nota]:

        if skip < 0:
            raise BusinessRuleError(
                "skip deve ser maior ou igual a zero"
            )

        if limit < 1 or limit > 500:
            raise BusinessRuleError(
                "limit deve estar entre 1 e 500"
            )

        stmt = (
            select(Nota)
            .order_by(Nota.idNota)
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(stmt).all())

    def buscar_por_id(self, id_nota: int) -> Nota:

        nota = self.db.get(Nota, id_nota)

        if nota is None:
            raise NotFoundError(
                f"Nota com idNota={id_nota} não encontrada"
            )

        return nota

    def criar(self, dados: NotaCreateSchema) -> Nota:

        self._validar_id_disponivel(dados.idNota)

        self._validar_cursamento_existente(
            dados.siMatricula,
            dados.idOfertaDisciplina,
        )

        nota = Nota(
            idNota=dados.idNota,
            siMatricula=dados.siMatricula,
            idOfertaDisciplina=dados.idOfertaDisciplina,
            notaValor=dados.notaValor,
        )

        try:
            self.db.add(nota)
            self.db.commit()
            self.db.refresh(nota)

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return nota

    def atualizar(
        self,
        id_nota: int,
        dados: NotaUpdateSchema,
    ) -> Nota:

        nota = self.buscar_por_id(id_nota)

        payload = dados.model_dump(exclude_unset=True)

        if not payload:
            raise BusinessRuleError(
                "Nenhum campo informado para atualização"
            )

        for campo, valor in payload.items():
            setattr(nota, campo, valor)

        try:
            self.db.commit()
            self.db.refresh(nota)

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return nota

    def remover(self, id_nota: int) -> None:

        nota = self.buscar_por_id(id_nota)

        try:
            self.db.delete(nota)
            self.db.commit()

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                "Não foi possível remover a nota"
            ) from exc

    def _validar_id_disponivel(self, id_nota: int) -> None:

        if self.db.get(Nota, id_nota) is not None:
            raise ConflictError(
                f"idNota={id_nota} já cadastrado"
            )

    def _validar_cursamento_existente(
        self,
        si_matricula: int,
        id_oferta_disciplina: int,
    ) -> None:

        stmt = select(Cursamento).where(
            Cursamento.siMatricula == si_matricula,
            Cursamento.idOfertaDisciplina == id_oferta_disciplina,
        )

        if self.db.scalars(stmt).first() is None:
            raise NotFoundError(
                "Cursamento informado não existe"
            )

    @staticmethod
    def _mensagem_integridade(exc: IntegrityError) -> str:

        mensagem = str(exc.orig) if exc.orig else str(exc)

        if "UNIQUE" in mensagem.upper():
            return "Violação de unicidade"

        if "FOREIGN KEY" in mensagem.upper():
            return "Violação de integridade referencial"

        return "Erro de integridade ao persistir dados"
