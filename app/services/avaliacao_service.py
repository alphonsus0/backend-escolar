from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.exceptions import (
    BusinessRuleError,
    ConflictError,
    NotFoundError,
)
from app.models.avaliacao import Avaliacao
from app.models.nota import Nota
from app.models.oferta_disciplina import OfertaDisciplina
from app.schemas.avaliacao import (
    AvaliacaoCreateSchema,
    AvaliacaoUpdateSchema,
)


class AvaliacaoService:
    """Operações de negócio da entidade AVALIACAO."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(
        self,
        *,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Avaliacao]:

        if skip < 0:
            raise BusinessRuleError(
                "skip deve ser maior ou igual a zero"
            )

        if limit < 1 or limit > 500:
            raise BusinessRuleError(
                "limit deve estar entre 1 e 500"
            )

        stmt = (
            select(Avaliacao)
            .order_by(Avaliacao.idAvaliacao)
            .offset(skip)
            .limit(limit)
        )

        return list(self.db.scalars(stmt).all())

    def buscar_por_id(
        self,
        id_avaliacao: int,
    ) -> Avaliacao:

        avaliacao = self.db.get(
            Avaliacao,
            id_avaliacao,
        )

        if avaliacao is None:
            raise NotFoundError(
                f"Avaliação com idAvaliacao={id_avaliacao} não encontrada"
            )

        return avaliacao

    def criar(
        self,
        dados: AvaliacaoCreateSchema,
    ) -> Avaliacao:

        self._validar_id_disponivel(
            dados.idAvaliacao
        )

        self._validar_nota_existente(
            dados.idNota
        )

        self._validar_oferta_existente(
            dados.idOfertaDisciplina
        )

        self._validar_limite_avaliacoes(
            dados.idOfertaDisciplina
        )

        avaliacao = Avaliacao(
            idAvaliacao=dados.idAvaliacao,
            peso=dados.peso,
            nomeAvaliacao=dados.nomeAvaliacao,
            dataAvaliacao=dados.dataAvaliacao,
            tipoAvaliacao=dados.tipoAvaliacao,
            descAvaliacao=dados.descAvaliacao,
            idNota=dados.idNota,
            idOfertaDisciplina=dados.idOfertaDisciplina,
        )

        try:
            self.db.add(avaliacao)
            self.db.commit()
            self.db.refresh(avaliacao)

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return avaliacao

    def atualizar(
        self,
        id_avaliacao: int,
        dados: AvaliacaoUpdateSchema,
    ) -> Avaliacao:

        avaliacao = self.buscar_por_id(
            id_avaliacao
        )

        payload = dados.model_dump(
            exclude_unset=True
        )

        if not payload:
            raise BusinessRuleError(
                "Nenhum campo informado para atualização"
            )

        for campo, valor in payload.items():
            setattr(avaliacao, campo, valor)

        try:
            self.db.commit()
            self.db.refresh(avaliacao)

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                self._mensagem_integridade(exc)
            ) from exc

        return avaliacao

    def remover(
        self,
        id_avaliacao: int,
    ) -> None:

        avaliacao = self.buscar_por_id(
            id_avaliacao
        )

        try:
            self.db.delete(avaliacao)
            self.db.commit()

        except IntegrityError as exc:
            self.db.rollback()

            raise ConflictError(
                "Não foi possível remover a avaliação"
            ) from exc

    def _validar_id_disponivel(
        self,
        id_avaliacao: int,
    ) -> None:

        if (
            self.db.get(
                Avaliacao,
                id_avaliacao,
            )
            is not None
        ):
            raise ConflictError(
                f"idAvaliacao={id_avaliacao} já cadastrado"
            )

    def _validar_nota_existente(
        self,
        id_nota: int,
    ) -> None:

        if self.db.get(Nota, id_nota) is None:
            raise NotFoundError(
                f"Nota {id_nota} não encontrada"
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

    def _validar_limite_avaliacoes(
        self,
        id_oferta_disciplina: int,
    ) -> None:

        stmt = (
            select(func.count())
            .select_from(Avaliacao)
            .where(
                Avaliacao.idOfertaDisciplina
                == id_oferta_disciplina
            )
        )

        total = self.db.scalar(stmt) or 0

        if total >= 3:
            raise BusinessRuleError(
                "Uma oferta disciplina pode possuir no máximo 3 avaliações"
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
