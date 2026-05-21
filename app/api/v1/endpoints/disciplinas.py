from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.disciplina import (
    DisciplinaCreateSchema,
    DisciplinaResponseSchema,
    DisciplinaUpdateSchema,
)
from app.services.disciplina_service import DisciplinaService

router = APIRouter(prefix="/disciplinas", tags=["disciplinas"])


def get_disciplina_service(db: DbSession) -> DisciplinaService:
    return DisciplinaService(db)


DisciplinaServiceDep = Annotated[
    DisciplinaService,
    Depends(get_disciplina_service)
]

DisciplinaIdPath = Annotated[
    int,
    Path(ge=1, description="ID da disciplina")
]


@router.get("", response_model=list[DisciplinaResponseSchema])
def listar_disciplinas(
    service: DisciplinaServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    disciplinas = service.listar(skip=skip, limit=limit)
    return [
        DisciplinaResponseSchema.model_validate(disciplina)
        for disciplina in disciplinas
    ]


@router.get("/{id}", response_model=DisciplinaResponseSchema)
def buscar_disciplina(
    id: DisciplinaIdPath,
    service: DisciplinaServiceDep,
):
    disciplina = service.buscar_por_id(id)
    return DisciplinaResponseSchema.model_validate(disciplina)


@router.post(
    "",
    response_model=DisciplinaResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def criar_disciplina(
    dados: DisciplinaCreateSchema,
    service: DisciplinaServiceDep,
):
    disciplina = service.criar(dados)
    return DisciplinaResponseSchema.model_validate(disciplina)


@router.put("/{id}", response_model=DisciplinaResponseSchema)
def atualizar_disciplina(
    id: DisciplinaIdPath,
    dados: DisciplinaUpdateSchema,
    service: DisciplinaServiceDep,
):
    disciplina = service.atualizar(id, dados)
    return DisciplinaResponseSchema.model_validate(disciplina)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_disciplina(
    id: DisciplinaIdPath,
    service: DisciplinaServiceDep,
):
    service.remover(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)