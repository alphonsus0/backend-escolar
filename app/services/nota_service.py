from sqlalchemy import select
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, NotFoundError
from app.models.nota import Nota
from app.schemas.nota import NotaCreateSchema, NotaUpdateSchema
from app.services.db_procedures import exec_proc, exec_proc_returning_id


class NotaService:
    """Operações de NOTA via stored procedures."""

    def __init__(self, db: Session) -> None:
        self.db = db

    def listar(self, *, skip: int = 0, limit: int = 100) -> list[Nota]:
        if skip < 0:
            raise BusinessRuleError("skip deve ser maior ou igual a zero")
        if limit < 1 or limit > 500:
            raise BusinessRuleError("limit deve estar entre 1 e 500")
        stmt = select(Nota).order_by(Nota.idNota).offset(skip).limit(limit)
        return list(self.db.scalars(stmt).all())

    def buscar_por_id(self, id_nota: int) -> Nota:
        n = self.db.get(Nota, id_nota)
        if n is None:
            raise NotFoundError(f"Nota com idNota={id_nota} não encontrada")
        return n

    def criar(self, dados: NotaCreateSchema) -> Nota:
        novo_id = exec_proc_returning_id(self.db, "sp_InserirNota", {
            "nota":               dados.nota,
            "siMatricula":        dados.siMatricula,
            "idOfertaDisciplina": dados.idOfertaDisciplina,
            "idAvaliacao":        dados.idAvaliacao,
        })
        return self.buscar_por_id(novo_id)

    def atualizar(self, id_nota: int, dados: NotaUpdateSchema) -> Nota:
        if dados.nota is None:
            raise BusinessRuleError("Informe o valor da nota")
        exec_proc(self.db, "sp_AtualizarNota", {
            "idNota": id_nota,
            "nota":   dados.nota,
        })
        return self.buscar_por_id(id_nota)

    def remover(self, id_nota: int) -> None:
        exec_proc(self.db, "sp_DeletarNota", {"idNota": id_nota})
