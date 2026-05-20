from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, ConflictError, NotFoundError
from app.models.cursamento import Cursamento
from app.models.matricula import Matricula
from app.models.oferta_disciplina import OfertaDisciplina
from app.schemas.cursamento import (
    CursamentoCreateSchema,
    CursamentoUpdateSchema,
)


class CursamentoService:
    """Operações de negócio da entidade CURSAMENTO."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Cursamento]:

        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")

        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")

        stmt = (
            select(Cursamento)
            .order_by(
                Cursamento.siMatricula,
                Cursamento.idOfertaDisciplina,
            )
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(stmt).all())

    def buscar_por_id(
        self,
        si_matricula: int,
        id_oferta_disciplina: int,
    ) -> Cursamento:

        cursamento = self._get_or_none(
            si_matricula,
            id_oferta_disciplina,
        )

        if cursamento is None:
            raise NotFoundError(
                "Cursamento não encontrado"
            )

        return cursamento

    def criar(
        self,
        dados: CursamentoCreateSchema,
    ) -> Cursamento:

        self._validar_matricula_existente(dados.siMatricula)
        self._validar_oferta_existente(dados.idOfertaDisciplina)
        self._validar_nao_duplicado(
            dados.siMatricula,
            dados.idOfertaDisciplina,
        )

        cursamento = Cursamento(
            siMatricula=dados.siMatricula,
            idOfertaDisciplina=dados.idOfertaDisciplina,
            mediaFinal=dados.mediaFinal,
            faltas=dados.faltas,
            situacaoFinal=dados.situacaoFinal,
            obs=dados.obs,
        )

        try:
            self.db.add(cursamento)
            self.db.commit()
            self.db.refresh(cursamento)

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return cursamento

    def atualizar(
        self,
        si_matricula: int,
        id_oferta_disciplina: int,
        dados: CursamentoUpdateSchema,
    ) -> Cursamento:

        cursamento = self.buscar_por_id(
            si_matricula,
            id_oferta_disciplina,
        )

        payload = dados.model_dump(exclude_unset=True)

        if not payload:
            raise BusinessRuleError(
                "Nenhum campo informado para atualização"
            )

        for campo, valor in payload.items():
            setattr(cursamento, campo, valor)

        try:
            self.db.commit()
            self.db.refresh(cursamento)

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return cursamento

    def remover(
        self,
        si_matricula: int,
        id_oferta_disciplina: int,
    ) -> None:

        cursamento = self.buscar_por_id(
            si_matricula,
            id_oferta_disciplina,
        )

        try:
            self.db.delete(cursamento)
            self.db.commit()

        except IntegrityError as exc:
            self.db.rollback()
            raise ConflictError(
                "Não é possível remover o cursamento: existem registros vinculados"
            ) from exc

    def _get_or_none(
        self,
        si_matricula: int,
        id_oferta_disciplina: int,
    ) -> Cursamento | None:

        stmt = select(Cursamento).where(
            Cursamento.siMatricula == si_matricula,
            Cursamento.idOfertaDisciplina == id_oferta_disciplina,
        )

        return self.db.scalars(stmt).first()

    def _validar_matricula_existente(
        self,
        si_matricula: int,
    ) -> None:

        if self.db.get(Matricula, si_matricula) is None:
            raise NotFoundError(
                f"Matrícula {si_matricula} não encontrada"
            )

    def _validar_oferta_existente(
        self,
        id_oferta_disciplina: int,
    ) -> None:

        if (
            self.db.get(
                OfertaDisciplina,
                id_oferta_disciplina,
            )
            is None
        ):
            raise NotFoundError(
                f"OfertaDisciplina {id_oferta_disciplina} não encontrada"
            )

    def _validar_nao_duplicado(
        self,
        si_matricula: int,
        id_oferta_disciplina: int,
    ) -> None:

        if (
            self._get_or_none(
                si_matricula,
                id_oferta_disciplina,
            )
            is not None
        ):
            raise ConflictError(
                "Cursamento já cadastrado"
            )

    @staticmethod
    def _mensagem_integridade(exc: IntegrityError) -> str:
        mensagem = str(exc.orig) if exc.orig else str(exc)

        if "UNIQUE" in mensagem.upper():
            return "Violação de unicidade"

        if "FOREIGN KEY" in mensagem.upper():
            return "Violação de integridade referencial"

        return "Erro de integridade ao persistir dados"
