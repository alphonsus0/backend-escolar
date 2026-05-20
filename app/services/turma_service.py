from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, ConflictError, NotFoundError

from app.models.matricula import Matricula
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.turma import Turma

from app.schemas.turma import (
    TurmaCreateSchema,
    TurmaUpdateSchema,
)


class TurmaService:
    """Operações de negócio da entidade TURMA."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Turma]:

        if skip < 0:
            raise BusinessRuleError(
                "skip deve ser maior ou igual a zero"
            )

        if limit < 1 or limit > 500:
            raise BusinessRuleError(
                "limit deve estar entre 1 e 500"
            )

        stmt = (
            select(Turma)
            .order_by(Turma.idTurma)
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(stmt).all())

    def buscar_por_id(self, id_turma: int) -> Turma:

        turma = self._get_turma_or_none(id_turma)

        if turma is None:
            raise NotFoundError(
                f"Turma com idTurma={id_turma} não encontrada"
            )

        return turma

    def criar(self, dados: TurmaCreateSchema) -> Turma:

        self._validar_id_disponivel(dados.idTurma)

        self._validar_turno(dados.turno)

        turma = Turma(
            idTurma=dados.idTurma,
            nomeTurma=dados.nomeTurma,
            turno=dados.turno,
            serie=dados.serie,
            salasTurma=dados.salasTurma,
            anoLetivo=dados.anoLetivo,
        )

        try:
            self.db.add(turma)

            self.db.commit()

            self.db.refresh(turma)

        except IntegrityError as exc:

            self.db.rollback()

            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return turma

    def atualizar(
        self,
        id_turma: int,
        dados: TurmaUpdateSchema,
    ) -> Turma:

        turma = self.buscar_por_id(id_turma)

        payload = dados.model_dump(exclude_unset=True)

        if not payload:
            raise BusinessRuleError(
                "Nenhum campo informado para atualização"
            )

        if "turno" in payload:
            self._validar_turno(payload["turno"])

        for campo, valor in payload.items():
            setattr(turma, campo, valor)

        try:

            self.db.commit()

            self.db.refresh(turma)

        except IntegrityError as exc:

            self.db.rollback()

            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return turma

    def remover(self, id_turma: int) -> None:

        turma = self.buscar_por_id(id_turma)

        self._validar_remocao_sem_vinculos(id_turma)

        try:

            self.db.delete(turma)

            self.db.commit()

        except IntegrityError as exc:

            self.db.rollback()

            raise ConflictError(
                "Não é possível remover a turma: existem registros vinculados"
            ) from exc

    def _get_turma_or_none(
        self,
        id_turma: int,
    ) -> Turma | None:

        stmt = (
            select(Turma)
            .where(Turma.idTurma == id_turma)
        )

        return self.db.scalars(stmt).first()

    def _validar_id_disponivel(
        self,
        id_turma: int,
    ) -> None:

        if self.db.get(Turma, id_turma) is not None:
            raise ConflictError(
                f"idTurma={id_turma} já cadastrado"
            )

    def _validar_turno(
        self,
        turno: str,
    ) -> None:

        turno_normalizado = turno.strip()

        if not turno_normalizado:
            raise BusinessRuleError(
                "turno não pode ser vazio"
            )

        if len(turno_normalizado) > 20:
            raise BusinessRuleError(
                "turno deve ter no máximo 20 caracteres"
            )

    def _validar_remocao_sem_vinculos(
        self,
        id_turma: int,
    ) -> None:

        stmt_matricula = (
            select(Matricula.idMatricula)
            .where(Matricula.idTurma == id_turma)
            .limit(1)
        )

        if self.db.scalars(stmt_matricula).first() is not None:
            raise BusinessRuleError(
                "Turma possui matrículas vinculadas e não pode ser removida"
            )

        stmt_oferta = (
            select(OfertaDisciplina.idOfertaDisciplina)
            .where(OfertaDisciplina.idTurma == id_turma)
            .limit(1)
        )

        if self.db.scalars(stmt_oferta).first() is not None:
            raise BusinessRuleError(
                "Turma possui ofertas de disciplina vinculadas e não pode ser removida"
            )

    @staticmethod
    def _mensagem_integridade(
        exc: IntegrityError,
    ) -> str:

        mensagem = (
            str(exc.orig)
            if exc.orig
            else str(exc)
        )

        if (
            "UNIQUE" in mensagem.upper()
            or "duplicate" in mensagem.lower()
        ):
            return "Violação de unicidade: registro duplicado"

        if "FOREIGN KEY" in mensagem.upper():
            return "Violação de integridade referencial"

        return "Erro de integridade ao persistir dados"
