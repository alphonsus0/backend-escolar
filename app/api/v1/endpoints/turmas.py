from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.turma import (
    TurmaCreateSchema,
    TurmaResponseSchema,
    TurmaUpdateSchema,
)
from app.services.turma_service import TurmaService

router = APIRouter(prefix="/turmas", tags=["turmas"])


def get_turma_service(db: DbSession) -> TurmaService:
    return TurmaService(db)


TurmaServiceDep = Annotated[
    TurmaService,
    Depends(get_turma_service)
]

TurmaIdPath = Annotated[
    int,
    Path(ge=1, description="ID da turma")
]


@router.get("", response_model=list[TurmaResponseSchema])
def listar_turmas(
    service: TurmaServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    turmas = service.listar(skip=skip, limit=limit)
    return [
        TurmaResponseSchema.model_validate(turma)
        for turma in turmas
    ]


@router.get("/{id}", response_model=TurmaResponseSchema)
def buscar_turma(
    id: TurmaIdPath,
    service: TurmaServiceDep,
):
    turma = service.buscar_por_id(id)
    return TurmaResponseSchema.model_validate(turma)


@router.post(
    "",
    response_model=TurmaResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def criar_turma(
    dados: TurmaCreateSchema,
    service: TurmaServiceDep,
):
    turma = service.criar(dados)
    return TurmaResponseSchema.model_validate(turma)


@router.put("/{id}", response_model=TurmaResponseSchema)
def atualizar_turma(
    id: TurmaIdPath,
    dados: TurmaUpdateSchema,
    service: TurmaServiceDep,
):
    turma = service.atualizar(id, dados)
    return TurmaResponseSchema.model_validate(turma)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_turma(
    id: TurmaIdPath,
    service: TurmaServiceDep,
):
    service.remover(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)