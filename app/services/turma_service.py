from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.turma import Turma
from app.schemas.turma import TurmaCreateSchema, TurmaUpdateSchema
from app.services.db_procedures import exec_proc, exec_proc_returning_id


class TurmaService:
    """Operações de TURMA via stored procedures (sp_*Turma)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Turma]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")
        stmt = select(Turma).order_by(Turma.idTurma).offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())

    def buscar_por_id(self, id_turma: int) -> Turma:
        turma = self.db.get(Turma, id_turma)
        if turma is None:
            raise NotFoundError(f"Turma com idTurma={id_turma} não encontrada")
        return turma

    def criar(self, dados: TurmaCreateSchema) -> Turma:
        novo_id = exec_proc_returning_id(self.db, "sp_InserirTurma", {
            "nomeTurma":  dados.nomeTurma,
            "turno":      dados.turno,
            "serie":      dados.serie,
            "salasTurma": dados.salasTurma,
            "anoLetivo":  dados.anoLetivo,
        })
        return self.buscar_por_id(novo_id)

    def atualizar(self, id_turma: int, dados: TurmaUpdateSchema) -> Turma:
        payload = dados.model_dump(exclude_unset=True)
        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")
        exec_proc(self.db, "sp_AtualizarTurma", {
            "idTurma":    id_turma,
            "nomeTurma":  payload.get("nomeTurma"),
            "turno":      payload.get("turno"),
            "serie":      payload.get("serie"),
            "salasTurma": payload.get("salasTurma"),
            "anoLetivo":  payload.get("anoLetivo"),
        })
        return self.buscar_por_id(id_turma)

    def remover(self, id_turma: int) -> None:
        exec_proc(self.db, "sp_DeletarTurma", {"idTurma": id_turma})
