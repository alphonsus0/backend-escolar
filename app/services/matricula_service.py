from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)

from app.models.aluno import Aluno
from app.models.cursamento import Cursamento
from app.models.matricula import Matricula
from app.models.turma import Turma

from app.schemas.matricula import (
    MatriculaCreateSchema,
    MatriculaUpdateSchema,
)


class MatriculaService:
    """Operações de negócio da entidade MATRICULA."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Matricula]:

        if skip < 0:
            raise BusinessRuleError(
                "skip deve ser maior ou igual a zero"
            )

        if limit < 1 or limit > 500:
            raise BusinessRuleError(
                "limit deve estar entre 1 e 500"
            )

        stmt = (
            select(Matricula)
            .order_by(Matricula.idMatricula)
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(stmt).all())

    def buscar_por_id(
        self,
        matricula_id: int,
    ) -> Matricula:

        matricula = self.db.get(
            Matricula,
            matricula_id,
        )

        if matricula is None:
            raise NotFoundError(
                f"Matrícula com idMatricula={matricula_id} não encontrada"
            )

        return matricula

    def criar(
        self,
        dados: MatriculaCreateSchema,
    ) -> Matricula:

        self._validar_id_disponivel(dados.idMatricula)
        self._validar_aluno_existente(dados.pessoa_id)
        self._validar_turma_existente(dados.idTurma)
        self._validar_status(dados.statusMatricula)

        matricula = Matricula(
            idMatricula=dados.idMatricula,
            anoLetivo=dados.anoLetivo,
            semestre=dados.semestre,
            dataMatricula=dados.dataMatricula,
            statusMatricula=dados.statusMatricula,
            pessoa_id=dados.pessoa_id,
            idTurma=dados.idTurma,
        )

        try:
            self.db.add(matricula)
            self.db.commit()
            self.db.refresh(matricula)

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return matricula

    def atualizar(
        self,
        matricula_id: int,
        dados: MatriculaUpdateSchema,
    ) -> Matricula:

        matricula = self.buscar_por_id(matricula_id)

        payload = dados.model_dump(exclude_unset=True)

        if not payload:
            raise BusinessRuleError(
                "Nenhum campo informado para atualização"
            )

        if "pessoa_id" in payload:
            self._validar_aluno_existente(
                payload["pessoa_id"]
            )

        if "idTurma" in payload:
            self._validar_turma_existente(
                payload["idTurma"]
            )

        if "statusMatricula" in payload:
            self._validar_status(
                payload["statusMatricula"]
            )

        campos = (
            "anoLetivo",
            "semestre",
            "dataMatricula",
            "statusMatricula",
            "pessoa_id",
            "idTurma",
        )

        for campo in campos:
            if campo in payload:
                setattr(matricula, campo, payload[campo])

        try:
            self.db.commit()
            self.db.refresh(matricula)

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return matricula

    def remover(
        self,
        matricula_id: int,
    ) -> None:

        matricula = self.buscar_por_id(matricula_id)

        self._validar_sem_cursamentos(
            matricula.idMatricula
        )

        try:
            self.db.delete(matricula)
            self.db.commit()

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                "Não é possível remover a matrícula: existem registros vinculados"
            ) from exc

    def _validar_id_disponivel(
        self,
        matricula_id: int,
    ) -> None:

        if self.db.get(Matricula, matricula_id) is not None:
            raise ConflictError(
                f"idMatricula={matricula_id} já está cadastrado"
            )

    def _validar_aluno_existente(
        self,
        pessoa_id: int,
    ) -> None:

        if self.db.get(Aluno, pessoa_id) is None:
            raise NotFoundError(
                f"Aluno com pessoa_id={pessoa_id} não encontrado"
            )

    def _validar_turma_existente(
        self,
        turma_id: int,
    ) -> None:

        if self.db.get(Turma, turma_id) is None:
            raise NotFoundError(
                f"Turma com idTurma={turma_id} não encontrada"
            )

    def _validar_status(
        self,
        status: str,
    ) -> None:

        status_normalizado = status.strip()

        if not status_normalizado:
            raise BusinessRuleError(
                "statusMatricula não pode ser vazio"
            )

        if len(status_normalizado) > 20:
            raise BusinessRuleError(
                "statusMatricula deve ter no máximo 20 caracteres"
            )

    def _validar_sem_cursamentos(
        self,
        matricula_id: int,
    ) -> None:

        stmt = (
            select(Cursamento.siMatricula)
            .where(
                Cursamento.siMatricula == matricula_id
            )
            .limit(1)
        )

        if self.db.scalars(stmt).first() is not None:
            raise BusinessRuleError(
                "Matrícula possui cursamentos vinculados"
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
