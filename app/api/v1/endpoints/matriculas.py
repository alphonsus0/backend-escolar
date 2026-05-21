from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.matricula import (
    MatriculaCreateSchema,
    MatriculaResponseSchema,
    MatriculaUpdateSchema,
)
from app.services.matricula_service import MatriculaService

router = APIRouter( prefix="/matriculas", tags=["matriculas"])


def get_matricula_service(db: DbSession) -> MatriculaService:
    return MatriculaService(db)


MatriculaServiceDep = Annotated[
    MatriculaService,
    Depends(get_matricula_service)
]

MatriculaIdPath = Annotated[
    int,
    Path(ge=1, description="ID da matrícula")
]


@router.get("", response_model=list[MatriculaResponseSchema])
def listar_matriculas(
    service: MatriculaServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    matriculas = service.listar(skip=skip, limit=limit)
    return [
        MatriculaResponseSchema.model_validate(matricula)
        for matricula in matriculas
    ]


@router.get("/{id}", response_model=MatriculaResponseSchema)
def buscar_matricula(
    id: MatriculaIdPath,
    service: MatriculaServiceDep,
):
    matricula = service.buscar_por_id(id)
    return MatriculaResponseSchema.model_validate(matricula)


@router.post(
    "",
    response_model=MatriculaResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def criar_matricula(
    dados: MatriculaCreateSchema,
    service: MatriculaServiceDep,
):
    matricula = service.criar(dados)
    return MatriculaResponseSchema.model_validate(matricula)


@router.put("/{id}", response_model=MatriculaResponseSchema)
def atualizar_matricula(
    id: MatriculaIdPath,
    dados: MatriculaUpdateSchema,
    service: MatriculaServiceDep,
):
    matricula = service.atualizar(id, dados)
    return MatriculaResponseSchema.model_validate(matricula)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_matricula(
    id: MatriculaIdPath,
    service: MatriculaServiceDep,
):
    service.remover(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)