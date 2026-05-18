from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.aluno import AlunoCreateSchema, AlunoResponseSchema, AlunoUpdateSchema
from app.services.aluno_service import AlunoService

router = APIRouter(prefix="/alunos", tags=["alunos"])


def get_aluno_service(db: DbSession) -> AlunoService:
    return AlunoService(db)


AlunoServiceDep = Annotated[AlunoService, Depends(get_aluno_service)]
AlunoIdPath = Annotated[int, Path(ge=1, description="ID do aluno (pessoa_id em PESSOA/ALUNO)")]


@router.get(
    "",
    response_model=list[AlunoResponseSchema],
    summary="Listar alunos",
    description="Retorna alunos cadastrados (PESSOA + ALUNO) com paginação.",
)
def listar_alunos(
    service: AlunoServiceDep,
    skip: int = Query(0, ge=0, description="Registros a ignorar"),
    limit: int = Query(100, ge=1, le=500, description="Quantidade máxima de registros"),
) -> list[AlunoResponseSchema]:
    alunos = service.listar(skip=skip, limit=limit)
    return [AlunoResponseSchema.model_validate(aluno) for aluno in alunos]


@router.get(
    "/{id}",
    response_model=AlunoResponseSchema,
    summary="Buscar aluno por ID",
    description="Busca aluno pelo `pessoa_id` (chave compartilhada PESSOA/ALUNO).",
)
def buscar_aluno(
    id: AlunoIdPath,
    service: AlunoServiceDep,
) -> AlunoResponseSchema:
    aluno = service.buscar_por_id(id)
    return AlunoResponseSchema.model_validate(aluno)


@router.post(
    "",
    response_model=AlunoResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Criar aluno",
    description="Cria registros em PESSOA e ALUNO na mesma transação.",
)
def criar_aluno(
    dados: AlunoCreateSchema,
    service: AlunoServiceDep,
) -> AlunoResponseSchema:
    aluno = service.criar(dados)
    return AlunoResponseSchema.model_validate(aluno)


@router.put(
    "/{id}",
    response_model=AlunoResponseSchema,
    summary="Atualizar aluno",
    description="Atualiza dados de PESSOA e/ou ALUNO. Envie apenas os campos a alterar.",
)
def atualizar_aluno(
    id: AlunoIdPath,
    dados: AlunoUpdateSchema,
    service: AlunoServiceDep,
) -> AlunoResponseSchema:
    aluno = service.atualizar(id, dados)
    return AlunoResponseSchema.model_validate(aluno)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover aluno",
    description="Remove ALUNO e PESSOA quando não houver matrículas vinculadas.",
)
def remover_aluno(
    id: AlunoIdPath,
    service: AlunoServiceDep,
) -> Response:
    service.remover(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
