"""Helpers de execução de Stored Procedures.

Todas as operações de escrita (INSERT/UPDATE/DELETE) do sistema passam por
procedures definidas em docs/procedures.sql. Este módulo concentra:

- `exec_proc` — executa uma procedure e mapeia os erros de RAISERROR/THROW
  para as exceções de domínio (`AppError`).
- `error_for_code` — converte códigos SQL (51xxx) em mensagens amigáveis.

Leituras (SELECT) continuam usando os models SQLAlchemy diretamente, já que
não modificam estado e se beneficiam de joinedload/paginação.
"""

from __future__ import annotations

import re
from typing import Any, Mapping

from sqlalchemy import text
from sqlalchemy.exc import DBAPIError
from sqlalchemy.orm import Session

from app.exceptions import BusinessRuleError, ConflictError, NotFoundError


# Códigos definidos em procedures.sql. Cada faixa corresponde a uma entidade.
_CONFLICT_CODES = {51100, 51101, 51110, 51111, 51121, 51122, 51140, 51141,
                   51170, 51180, 51190, 51200, 51203, 51210, 51220, 51230, 51233}
_NOT_FOUND_CODES = {51120, 51130, 51150, 51160, 51171, 51181, 51194, 51204,
                    51213, 51223, 51234, 51235, 51300}


def _raise_for_error(exc: DBAPIError) -> None:
    """Converte uma DBAPIError do pyodbc em AppError apropriado."""
    msg = str(exc.orig) if exc.orig else str(exc)

    code_match = re.search(r"\((\d{4,5})\)", msg) or re.search(r"Error (\d{4,5})", msg)
    code = int(code_match.group(1)) if code_match else None

    # Extrai a mensagem amigável (entre []) do erro pyodbc.
    user_msg_match = re.search(r"\[Microsoft\]\[ODBC.*?SQL Server\](.+?)(\(\d+\)|$)", msg)
    user_msg = user_msg_match.group(1).strip() if user_msg_match else msg
    user_msg = user_msg.strip().rstrip(".")

    if code in _NOT_FOUND_CODES:
        raise NotFoundError(user_msg) from exc
    if code in _CONFLICT_CODES:
        raise ConflictError(user_msg) from exc
    if code and 51000 <= code < 52000:
        raise BusinessRuleError(user_msg) from exc

    # Erros de constraint do próprio SQL Server.
    if "UNIQUE" in msg.upper() or "duplicate" in msg.lower():
        raise ConflictError("Violação de unicidade: registro duplicado") from exc
    if "FOREIGN KEY" in msg.upper():
        raise ConflictError("Violação de integridade referencial") from exc
    if "CHECK constraint" in msg or "CHECK_" in msg.upper():
        raise BusinessRuleError(user_msg) from exc

    raise BusinessRuleError(user_msg) from exc


def exec_proc(db: Session, proc_name: str, params: Mapping[str, Any]) -> None:
    """Executa uma stored procedure. Faz commit em sucesso, rollback em erro.

    `params` é mapeado para parâmetros nomeados `@nome`. Valores `None` são
    enviados como NULL — a procedure usa COALESCE para preservar valores
    existentes em atualizações parciais.
    """
    placeholders = ", ".join(f"@{k}=:{k}" for k in params.keys())
    sql = text(f"EXEC {proc_name} {placeholders}") if placeholders else text(f"EXEC {proc_name}")
    try:
        db.execute(sql, dict(params))
        db.commit()
    except DBAPIError as exc:
        db.rollback()
        _raise_for_error(exc)


def exec_proc_returning_id(
    db: Session, proc_name: str, params: Mapping[str, Any]
) -> int:
    """Executa uma SP que devolve o ID gerado (SELECT SCOPE_IDENTITY()).

    Retorna o inteiro produzido pelo SELECT final da procedure.
    """
    placeholders = ", ".join(f"@{k}=:{k}" for k in params.keys())
    sql = text(f"EXEC {proc_name} {placeholders}") if placeholders else text(f"EXEC {proc_name}")
    try:
        result = db.execute(sql, dict(params))
        new_id = result.scalar()
        db.commit()
        if new_id is None:
            raise BusinessRuleError(
                f"Procedure {proc_name} não retornou o ID gerado"
            )
        return int(new_id)
    except DBAPIError as exc:
        db.rollback()
        _raise_for_error(exc)
        raise  # pragma: no cover — _raise_for_error sempre lança
