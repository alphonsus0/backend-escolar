from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.disciplina import Disciplina
from app.models.oferta_disciplina import OfertaDisciplina
from app.models.professor import Professor
from app.models.turma import Turma
from app.schemas.ofertaDisciplina import (
    OfertaDisciplinaCreateSchema,
    OfertaDisciplinaUpdateSchema,
)


class OfertaDisciplinaService:
    """Operações de negócio da entidade OFERTADISCIPLINA."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[OfertaDisciplina]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")

        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")

        stmt = (
            select(OfertaDisciplina)
            .order_by(OfertaDisciplina.idOfertaDisciplina)
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(stmt).all())

    def buscar_por_id(self, id_oferta: int) -> OfertaDisciplina:
        oferta = self.db.get(OfertaDisciplina, id_oferta)

        if oferta is None:
            raise NotFoundError(
                f"OfertaDisciplina com id={id_oferta} não encontrada"
            )

        return oferta

    def criar(
        self,
        dados: OfertaDisciplinaCreateSchema,
    ) -> OfertaDisciplina:
        self._validar_status(dados.statusOferta)
        self._validar_disciplina_existente(dados.idDisciplina)
        self._validar_turma_existente(dados.idTurma)
        self._validar_professor_existente(dados.pessoa_id)

        oferta = OfertaDisciplina(
            idOfertaDisciplina=dados.idOfertaDisciplina,
            anoLetivo=dados.anoLetivo,
            semestre=dados.semestre,
            sala=dados.sala,
            diaOferta=dados.diaOferta,
            mediaAprovacao=dados.mediaAprovacao,
            statusOferta=dados.statusOferta,
            idDisciplina=dados.idDisciplina,
            idTurma=dados.idTurma,
            pessoa_id=dados.pessoa_id,
        )

        try:
            self.db.add(oferta)
            self.db.commit()
            self.db.refresh(oferta)

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return oferta

    def atualizar(
        self,
        id_oferta: int,
        dados: OfertaDisciplinaUpdateSchema,
    ) -> OfertaDisciplina:
        oferta = self.buscar_por_id(id_oferta)

        payload = dados.model_dump(exclude_unset=True)

        if not payload:
            raise BusinessRuleError(
                "Nenhum campo informado para atualização"
            )

        if "statusOferta" in payload:
            self._validar_status(payload["statusOferta"])

        if "idDisciplina" in payload:
            self._validar_disciplina_existente(payload["idDisciplina"])

        if "idTurma" in payload:
            self._validar_turma_existente(payload["idTurma"])

        if "pessoa_id" in payload:
            self._validar_professor_existente(payload["pessoa_id"])

        for campo, valor in payload.items():
            setattr(oferta, campo, valor)

        try:
            self.db.commit()
            self.db.refresh(oferta)

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return oferta

    def remover(self, id_oferta: int) -> None:
        oferta = self.buscar_por_id(id_oferta)

        try:
            self.db.delete(oferta)
            self.db.commit()

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                "Não é possível remover a oferta: existem registros vinculados"
            ) from exc

    def _validar_disciplina_existente(self, id_disciplina: int) -> None:
        if self.db.get(Disciplina, id_disciplina) is None:
            raise NotFoundError(
                f"Disciplina com id={id_disciplina} não encontrada"
            )

    def _validar_turma_existente(self, id_turma: int) -> None:
        if self.db.get(Turma, id_turma) is None:
            raise NotFoundError(
                f"Turma com id={id_turma} não encontrada"
            )

    def _validar_professor_existente(self, pessoa_id: int) -> None:
        if self.db.get(Professor, pessoa_id) is None:
            raise NotFoundError(
                f"Professor com pessoa_id={pessoa_id} não encontrado"
            )

    def _validar_status(self, status: str) -> None:
        status_normalizado = status.strip()

        if not status_normalizado:
            raise BusinessRuleError(
                "statusOferta não pode ser vazio"
            )

        if len(status_normalizado) > 20:
            raise BusinessRuleError(
                "statusOferta deve ter no máximo 20 caracteres"
            )

    @staticmethod
    def _mensagem_integridade(exc: IntegrityError) -> str:
        mensagem = str(exc.orig) if exc.orig else str(exc)

        if "UNIQUE" in mensagem.upper():
            return "Violação de unicidade"

        if "FOREIGN KEY" in mensagem.upper():
            return "Violação de integridade referencial"

        return "Erro de integridade ao persistir dados"
