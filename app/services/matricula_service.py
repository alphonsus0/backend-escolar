from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.matricula import Matricula
from app.schemas.matricula import MatriculaCreateSchema, MatriculaUpdateSchema
from app.services.db_procedures import exec_proc, exec_proc_returning_id


class MatriculaService:
    """Operações de MATRICULA via stored procedures (sp_*Matricula)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Matricula]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")
        stmt = select(Matricula).order_by(Matricula.idMatricula).offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())

    def buscar_por_id(self, id_matricula: int) -> Matricula:
        m = self.db.get(Matricula, id_matricula)
        if m is None:
            raise NotFoundError(f"Matrícula com idMatricula={id_matricula} não encontrada")
        return m

    def criar(self, dados: MatriculaCreateSchema) -> Matricula:
        novo_id = exec_proc_returning_id(self.db, "sp_InserirMatricula", {
            "anoLetivo":       dados.anoLetivo,
            "semestre":        dados.semestre,
            "dataMatricula":   dados.dataMatricula,
            "statusMatricula": dados.statusMatricula,
            "pessoa_id":       dados.pessoa_id,
            "idTurma":         dados.idTurma,
        })
        return self.buscar_por_id(novo_id)

    def atualizar(self, id_matricula: int, dados: MatriculaUpdateSchema) -> Matricula:
        payload = dados.model_dump(exclude_unset=True)
        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")
        # A procedure só permite alterar statusMatricula/dataMatricula;
        # mudança de aluno/turma/semestre exigiria nova matrícula.
        exec_proc(self.db, "sp_AtualizarMatricula", {
            "idMatricula":     id_matricula,
            "statusMatricula": payload.get("statusMatricula"),
            "dataMatricula":   payload.get("dataMatricula"),
        })
        return self.buscar_por_id(id_matricula)

    def remover(self, id_matricula: int) -> None:
        exec_proc(self.db, "sp_DeletarMatricula", {"idMatricula": id_matricula})

    def enturmar(self, id_matricula: int) -> None:
        """Cria CURSAMENTOs para todas as ofertas ATIVAs da turma/semestre."""
        exec_proc(self.db, "sp_EnturmarAluno", {"idMatricula": id_matricula})
