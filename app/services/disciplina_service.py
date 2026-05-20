from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)

from app.models.disciplina import Disciplina
from app.models.oferta_disciplina import OfertaDisciplina

from app.schemas.disciplina import (
    DisciplinaCreateSchema,
    DisciplinaUpdateSchema,
)


class DisciplinaService:
    """Operações de negócio da entidade DISCIPLINA."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Disciplina]:

        if skip < 0:
            raise BusinessRuleError(
                "skip deve ser maior ou igual a zero"
            )

        if limit < 1 or limit > 500:
            raise BusinessRuleError(
                "limit deve estar entre 1 e 500"
            )

        stmt = (
            select(Disciplina)
            .order_by(Disciplina.idDisciplina)
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(stmt).all())

    def buscar_por_id(
        self,
        disciplina_id: int,
    ) -> Disciplina:

        disciplina = self.db.get(
            Disciplina,
            disciplina_id,
        )

        if disciplina is None:
            raise NotFoundError(
                f"Disciplina com idDisciplina={disciplina_id} não encontrada"
            )

        return disciplina

    def criar(
        self,
        dados: DisciplinaCreateSchema,
    ) -> Disciplina:

        self._validar_id_disponivel(dados.idDisciplina)
        self._validar_status(dados.statusDisciplina)
        self._validar_carga_horaria(dados.cargaHoraria)

        disciplina = Disciplina(
            idDisciplina=dados.idDisciplina,
            nomeDisciplina=dados.nomeDisciplina,
            cargaHoraria=dados.cargaHoraria,
            statusDisciplina=dados.statusDisciplina,
        )

        try:
            self.db.add(disciplina)
            self.db.commit()
            self.db.refresh(disciplina)

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return disciplina

    def atualizar(
        self,
        disciplina_id: int,
        dados: DisciplinaUpdateSchema,
    ) -> Disciplina:

        disciplina = self.buscar_por_id(disciplina_id)

        payload = dados.model_dump(exclude_unset=True)

        if not payload:
            raise BusinessRuleError(
                "Nenhum campo informado para atualização"
            )

        if "statusDisciplina" in payload:
            self._validar_status(
                payload["statusDisciplina"]
            )

        if "cargaHoraria" in payload:
            self._validar_carga_horaria(
                payload["cargaHoraria"]
            )

        campos = (
            "nomeDisciplina",
            "cargaHoraria",
            "statusDisciplina",
        )

        for campo in campos:
            if campo in payload:
                setattr(disciplina, campo, payload[campo])

        try:
            self.db.commit()
            self.db.refresh(disciplina)

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return disciplina

    def remover(
        self,
        disciplina_id: int,
    ) -> None:

        disciplina = self.buscar_por_id(disciplina_id)

        self._validar_sem_ofertas(disciplina_id)

        try:
            self.db.delete(disciplina)
            self.db.commit()

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                "Não é possível remover a disciplina: existem registros vinculados"
            ) from exc

    def _validar_id_disponivel(
        self,
        disciplina_id: int,
    ) -> None:

        if self.db.get(Disciplina, disciplina_id) is not None:
            raise ConflictError(
                f"idDisciplina={disciplina_id} já está cadastrado"
            )

    def _validar_status(
        self,
        status: str,
    ) -> None:

        status_normalizado = status.strip()

        if not status_normalizado:
            raise BusinessRuleError(
                "statusDisciplina não pode ser vazio"
            )

        if len(status_normalizado) > 20:
            raise BusinessRuleError(
                "statusDisciplina deve ter no máximo 20 caracteres"
            )

    def _validar_carga_horaria(
        self,
        carga_horaria: int,
    ) -> None:

        if carga_horaria <= 0:
            raise BusinessRuleError(
                "cargaHoraria deve ser maior que zero"
            )

    def _validar_sem_ofertas(
        self,
        disciplina_id: int,
    ) -> None:

        stmt = (
            select(OfertaDisciplina.idOfertaDisciplina)
            .where(
                OfertaDisciplina.idDisciplina == disciplina_id
            )
            .limit(1)
        )

        if self.db.scalars(stmt).first() is not None:
            raise BusinessRuleError(
                "Disciplina possui ofertas vinculadas"
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

        if "UNIQUE" in mensagem.upper():
            return "Violação de unicidade"

        if "FOREIGN KEY" in mensagem.upper():
            return "Violação de integridade referencial"

        return "Erro de integridade ao persistir dados"
