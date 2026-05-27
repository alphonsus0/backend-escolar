from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.avaliacao import Avaliacao
from app.schemas.avaliacao import AvaliacaoCreateSchema, AvaliacaoUpdateSchema
from app.services.db_procedures import exec_proc, exec_proc_returning_id


class AvaliacaoService:
    """Operações de AVALIACAO via stored procedures."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Avaliacao]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")
        stmt = select(Avaliacao).order_by(Avaliacao.idAvaliacao).offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())

    def buscar_por_id(self, id_avaliacao: int) -> Avaliacao:
        a = self.db.get(Avaliacao, id_avaliacao)
        if a is None:
            raise NotFoundError(f"Avaliação com idAvaliacao={id_avaliacao} não encontrada")
        return a

    def criar(self, dados: AvaliacaoCreateSchema) -> Avaliacao:
        novo_id = exec_proc_returning_id(self.db, "sp_InserirAvaliacao", {
            "peso":               dados.peso,
            "nomeAvaliacao":      dados.nomeAvaliacao,
            "dataAvaliacao":      dados.dataAvaliacao,
            "tipoAvaliacao":      dados.tipoAvaliacao,
            "descAvaliacao":      dados.descAvaliacao,
            "idOfertaDisciplina": dados.idOfertaDisciplina,
        })
        return self.buscar_por_id(novo_id)

    def atualizar(self, id_avaliacao: int, dados: AvaliacaoUpdateSchema) -> Avaliacao:
        payload = dados.model_dump(exclude_unset=True)
        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")
        exec_proc(self.db, "sp_AtualizarAvaliacao", {
            "idAvaliacao":   id_avaliacao,
            "peso":          payload.get("peso"),
            "nomeAvaliacao": payload.get("nomeAvaliacao"),
            "dataAvaliacao": payload.get("dataAvaliacao"),
            "tipoAvaliacao": payload.get("tipoAvaliacao"),
            "descAvaliacao": payload.get("descAvaliacao"),
        })
        return self.buscar_por_id(id_avaliacao)

    def remover(self, id_avaliacao: int) -> None:
        exec_proc(self.db, "sp_DeletarAvaliacao", {"idAvaliacao": id_avaliacao})
