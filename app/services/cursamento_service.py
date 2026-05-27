from sqlalchemy import and_, select
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.cursamento import Cursamento
from app.schemas.cursamento import CursamentoCreateSchema, CursamentoUpdateSchema
from app.services.db_procedures import exec_proc


class CursamentoService:
    """Operações de CURSAMENTO via stored procedures."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Cursamento]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")
        stmt = (
            select(Cursamento)
            .order_by(Cursamento.siMatricula, Cursamento.idOfertaDisciplina)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def buscar(self, si_matricula: int, id_oferta: int) -> Cursamento:
        stmt = select(Cursamento).where(
            and_(
                Cursamento.siMatricula == si_matricula,
                Cursamento.idOfertaDisciplina == id_oferta,
            )
        )
        c = self.db.scalars(stmt).first()
        if c is None:
            raise NotFoundError(
                f"Cursamento (matricula={si_matricula}, oferta={id_oferta}) não encontrado"
            )
        return c

    def criar(self, dados: CursamentoCreateSchema) -> Cursamento:
        exec_proc(self.db, "sp_InserirCursamento", {
            "siMatricula":        dados.siMatricula,
            "idOfertaDisciplina": dados.idOfertaDisciplina,
            "faltas":             dados.faltas,
            "obs":                dados.obs,
        })
        return self.buscar(dados.siMatricula, dados.idOfertaDisciplina)

    def atualizar(
        self,
        si_matricula: int,
        id_oferta: int,
        dados: CursamentoUpdateSchema,
    ) -> Cursamento:
        payload = dados.model_dump(exclude_unset=True)
        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")
        exec_proc(self.db, "sp_AtualizarCursamento", {
            "siMatricula":        si_matricula,
            "idOfertaDisciplina": id_oferta,
            "faltas":             payload.get("faltas"),
            "situacaoFinal":      payload.get("situacaoFinal"),
            "obs":                payload.get("obs"),
        })
        return self.buscar(si_matricula, id_oferta)

    def remover(self, si_matricula: int, id_oferta: int) -> None:
        exec_proc(self.db, "sp_DeletarCursamento", {
            "siMatricula":        si_matricula,
            "idOfertaDisciplina": id_oferta,
        })

    def recalcular_media(self, si_matricula: int, id_oferta: int) -> Cursamento:
        """Força recálculo via sp_CalcularMediaFinalAluno."""
        exec_proc(self.db, "sp_CalcularMediaFinalAluno", {
            "siMatricula":        si_matricula,
            "idOfertaDisciplina": id_oferta,
        })
        return self.buscar(si_matricula, id_oferta)
