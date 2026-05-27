from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.disciplina import Disciplina
from app.schemas.disciplina import DisciplinaCreateSchema, DisciplinaUpdateSchema
from app.services.db_procedures import exec_proc, exec_proc_returning_id


class DisciplinaService:
    """Operações de DISCIPLINA via stored procedures (sp_*Disciplina)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Disciplina]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")

        stmt = (
            select(Disciplina)
            .order_by(Disciplina.idDisciplina)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).all())

    def buscar_por_id(self, id_disciplina: int) -> Disciplina:
        disciplina = self.db.get(Disciplina, id_disciplina)
        if disciplina is None:
            raise NotFoundError(f"Disciplina com idDisciplina={id_disciplina} não encontrada")
        return disciplina

    def criar(self, dados: DisciplinaCreateSchema) -> Disciplina:
        novo_id = exec_proc_returning_id(self.db, "sp_InserirDisciplina", {
            "nomeDisciplina":   dados.nomeDisciplina,
            "cargaHoraria":     dados.cargaHoraria,
            "statusDisciplina": dados.statusDisciplina,
        })
        return self.buscar_por_id(novo_id)

    def atualizar(self, id_disciplina: int, dados: DisciplinaUpdateSchema) -> Disciplina:
        payload = dados.model_dump(exclude_unset=True)
        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")

        exec_proc(self.db, "sp_AtualizarDisciplina", {
            "idDisciplina":     id_disciplina,
            "nomeDisciplina":   payload.get("nomeDisciplina"),
            "cargaHoraria":     payload.get("cargaHoraria"),
            "statusDisciplina": payload.get("statusDisciplina"),
        })
        return self.buscar_por_id(id_disciplina)

    def remover(self, id_disciplina: int) -> None:
        exec_proc(self.db, "sp_DeletarDisciplina", {"idDisciplina": id_disciplina})
