from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.professor import (
    ProfessorCreateSchema,
    ProfessorResponseSchema,
    ProfessorUpdateSchema,
)
from app.services.professor_service import ProfessorService

router = APIRouter(prefix="/professores", tags=["professores"])


def get_professor_service(db: DbSession) -> ProfessorService:
    return ProfessorService(db)


ProfessorServiceDep = Annotated[ProfessorService, Depends(get_professor_service)]
ProfessorIdPath = Annotated[
    int,
    Path(ge=1, description="ID do professor (pessoa_id em PESSOA/PROFESSOR)"),
]


@router.get(
    "",
    response_model=list[ProfessorResponseSchema],
    summary="Listar professores",
    description="Retorna professores cadastrados (PESSOA + PROFESSOR) com paginação.",
)
def listar_professores(
    service: ProfessorServiceDep,
    skip: int = Query(0, ge=0, description="Registros a ignorar"),
    limit: int = Query(100, ge=1, le=500, description="Quantidade máxima de registros"),
) -> list[ProfessorResponseSchema]:
    professores = service.listar(skip=skip, limit=limit)
    return [ProfessorResponseSchema.model_validate(p) for p in professores]


@router.get(
    "/{id}",
    response_model=ProfessorResponseSchema,
    summary="Buscar professor por ID",
    description="Busca professor pelo `pessoa_id` (chave compartilhada PESSOA/PROFESSOR).",
)
def buscar_professor(
    id: ProfessorIdPath,
    service: ProfessorServiceDep,
) -> ProfessorResponseSchema:
    professor = service.buscar_por_id(id)
    return ProfessorResponseSchema.model_validate(professor)


@router.post(
    "",
    response_model=ProfessorResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Criar professor",
    description="Cria registros em PESSOA e PROFESSOR na mesma transação.",
)
def criar_professor(
    dados: ProfessorCreateSchema,
    service: ProfessorServiceDep,
) -> ProfessorResponseSchema:
    professor = service.criar(dados)
    return ProfessorResponseSchema.model_validate(professor)


@router.put(
    "/{id}",
    response_model=ProfessorResponseSchema,
    summary="Atualizar professor",
    description="Atualiza dados de PESSOA e/ou PROFESSOR. Envie apenas os campos a alterar.",
)
def atualizar_professor(
    id: ProfessorIdPath,
    dados: ProfessorUpdateSchema,
    service: ProfessorServiceDep,
) -> ProfessorResponseSchema:
    professor = service.atualizar(id, dados)
    return ProfessorResponseSchema.model_validate(professor)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover professor",
    description="Remove PROFESSOR e PESSOA quando não houver ofertas de disciplina vinculadas.",
)
def remover_professor(
    id: ProfessorIdPath,
    service: ProfessorServiceDep,
) -> Response:
    service.remover(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
