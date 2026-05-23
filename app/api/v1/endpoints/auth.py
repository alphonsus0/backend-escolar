from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import text

from app.core.security import create_access_token
from app.db.session import engine

router = APIRouter(prefix="/auth", tags=["auth"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends()):

    username = form_data.username
    password = form_data.password

    with engine.connect() as conn:

        # ==========================================
        # TENTA LOGIN COMO ALUNO
        # ==========================================

        aluno_query = text("""
            SELECT
                p.pessoa_id,
                p.nome,
                a.matriculaAluno,
                a.senha
            FROM aluno a
            INNER JOIN pessoa p
                ON p.pessoa_id = a.pessoa_id
            WHERE a.matriculaAluno = :username
        """)

        aluno = conn.execute(
            aluno_query,
            {"username": username}
        ).fetchone()

        if aluno:

            if aluno.senha != password:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Senha inválida"
                )

            token = create_access_token(
                subject=aluno.matriculaAluno,
                extra_claims={
                    "role": "aluno",
                    "pessoa_id": aluno.pessoa_id
                }
            )

            return TokenResponse(
                access_token=token,
                user={
                    "nome": aluno.nome,
                    "role": "aluno",
                    "matricula": aluno.matriculaAluno
                }
            )

        # ==========================================
        # TENTA LOGIN COMO PROFESSOR
        # ==========================================

        professor_query = text("""
            SELECT
                p.pessoa_id,
                p.nome,
                pr.matriculaProf,
                pr.senha
            FROM professor pr
            INNER JOIN pessoa p
                ON p.pessoa_id = pr.pessoa_id
            WHERE pr.matriculaProf = :username
        """)

        professor = conn.execute(
            professor_query,
            {"username": username}
        ).fetchone()

        if professor:

            if professor.senha != password:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Senha inválida"
                )

            token = create_access_token(
                subject=professor.matriculaProf,
                extra_claims={
                    "role": "professor",
                    "pessoa_id": professor.pessoa_id
                }
            )

            return TokenResponse(
                access_token=token,
                user={
                    "nome": professor.nome,
                    "role": "professor",
                    "matricula": professor.matriculaProf
                }
            )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Usuário não encontrado"
    )
