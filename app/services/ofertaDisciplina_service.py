from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.oferta_disciplina import OfertaDisciplina
from app.schemas.ofertaDisciplina import (
    OfertaDisciplinaCreateSchema,
    OfertaDisciplinaUpdateSchema,
)
from app.services.db_procedures import exec_proc, exec_proc_returning_id


class OfertaDisciplinaService:
    """Operações de OFERTADISCIPLINA via stored procedures."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[OfertaDisciplina]:
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
        o = self.db.get(OfertaDisciplina, id_oferta)
        if o is None:
            raise NotFoundError(f"Oferta com idOfertaDisciplina={id_oferta} não encontrada")
        return o

    def criar(self, dados: OfertaDisciplinaCreateSchema) -> OfertaDisciplina:
        novo_id = exec_proc_returning_id(self.db, "sp_InserirOfertaDisciplina", {
            "anoLetivo":          dados.anoLetivo,
            "semestre":           dados.semestre,
            "sala":               dados.sala,
            "diaOferta":          dados.diaOferta,
            "mediaAprovacao":     dados.mediaAprovacao,
            "statusOferta":       dados.statusOferta,
            "idDisciplina":       dados.idDisciplina,
            "idTurma":            dados.idTurma,
            "pessoa_id":          dados.pessoa_id,
        })
        return self.buscar_por_id(novo_id)

    def atualizar(self, id_oferta: int, dados: OfertaDisciplinaUpdateSchema) -> OfertaDisciplina:
        payload = dados.model_dump(exclude_unset=True)
        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")
        exec_proc(self.db, "sp_AtualizarOfertaDisciplina", {
            "idOfertaDisciplina": id_oferta,
            "anoLetivo":          payload.get("anoLetivo"),
            "semestre":           payload.get("semestre"),
            "sala":               payload.get("sala"),
            "diaOferta":          payload.get("diaOferta"),
            "mediaAprovacao":     payload.get("mediaAprovacao"),
            "statusOferta":       payload.get("statusOferta"),
            "idDisciplina":       payload.get("idDisciplina"),
            "idTurma":            payload.get("idTurma"),
            "pessoa_id":          payload.get("pessoa_id"),
        })
        return self.buscar_por_id(id_oferta)

    def remover(self, id_oferta: int) -> None:
        exec_proc(self.db, "sp_DeletarOfertaDisciplina", {"idOfertaDisciplina": id_oferta})
