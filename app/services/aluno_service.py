from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.security import get_password_hash
from app.exceptions import BusinessRuleError, NotFoundError
from app.models.aluno import Aluno
from app.schemas.aluno import AlunoCreateSchema, AlunoUpdateSchema
from app.services.db_procedures import exec_proc, exec_proc_returning_id


class AlunoService:
    """Operações de ALUNO via stored procedures (sp_*Aluno)."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Aluno]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")

        stmt = (
            select(Aluno)
            .options(joinedload(Aluno.pessoa))
            .order_by(Aluno.pessoa_id)
            .offset(skip)
            .limit(limit)
        )
        return list(self.db.scalars(stmt).unique().all())

    def buscar_por_id(self, pessoa_id: int) -> Aluno:
        stmt = (
            select(Aluno)
            .options(joinedload(Aluno.pessoa))
            .where(Aluno.pessoa_id == pessoa_id)
        )
        aluno = self.db.scalars(stmt).unique().first()
        if aluno is None:
            raise NotFoundError(f"Aluno com pessoa_id={pessoa_id} não encontrado")
        return aluno

    def criar(self, dados: AlunoCreateSchema) -> Aluno:
        novo_pessoa_id = exec_proc_returning_id(self.db, "sp_InserirAluno", {
            "nome":           dados.nome,
            "cpf":            dados.cpf,
            "dataNascimento": dados.dataNascimento,
            "endereco":       dados.endereco,
            "telefone":       dados.telefone,
            "statusAluno":    dados.statusAluno,
            "senha":          get_password_hash(dados.senha),
        })
        return self.buscar_por_id(novo_pessoa_id)

    def atualizar(self, pessoa_id: int, dados: AlunoUpdateSchema) -> Aluno:
        payload = dados.model_dump(exclude_unset=True)
        if not payload:
            raise BusinessRuleError("Nenhum campo informado para atualização")

        if "senha" in payload:
            payload["senha"] = get_password_hash(payload["senha"])

        params = {"pessoa_id": pessoa_id}
        for campo in ("nome", "cpf", "dataNascimento", "endereco", "telefone",
                      "statusAluno", "senha"):
            params[campo] = payload.get(campo)

        exec_proc(self.db, "sp_AtualizarAluno", params)
        return self.buscar_por_id(pessoa_id)

    def remover(self, pessoa_id: int) -> None:
        exec_proc(self.db, "sp_DeletarAluno", {"pessoa_id": pessoa_id})
