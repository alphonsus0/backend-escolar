from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.cursamento import (
    CursamentoCreateSchema,
    CursamentoResponseSchema,
    CursamentoUpdateSchema,
)
from app.services.cursamento_service import CursamentoService

router = APIRouter(
    prefix="/cursamentos",
    tags=["cursamentos"],
)


def get_cursamento_service(db: DbSession) -> CursamentoService:
    return CursamentoService(db)


CursamentoServiceDep = Annotated[
    CursamentoService,
    Depends(get_cursamento_service),
]


@router.get(
    "",
    response_model=list[CursamentoResponseSchema],
)
def listar_cursamentos(
    service: CursamentoServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):

    return service.listar(skip, limit)


@router.get(
    "/{siMatricula}/{idOfertaDisciplina}",
    response_model=CursamentoResponseSchema,
)
def buscar_cursamento(
    siMatricula: int = Path(..., ge=1),
    idOfertaDisciplina: int = Path(..., ge=1),
    service: CursamentoServiceDep = None,
):

    return service.buscar_por_id(
        siMatricula,
        idOfertaDisciplina,
    )


@router.post(
    "",
    response_model=CursamentoResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def criar_cursamento(
    dados: CursamentoCreateSchema,
    service: CursamentoServiceDep,
):

    return service.criar(dados)


@router.put(
    "/{siMatricula}/{idOfertaDisciplina}",
    response_model=CursamentoResponseSchema,
)
def atualizar_cursamento(
    dados: CursamentoUpdateSchema,
    service: CursamentoServiceDep,
    siMatricula: int = Path(..., ge=1),
    idOfertaDisciplina: int = Path(..., ge=1),
):

    return service.atualizar(
        siMatricula,
        idOfertaDisciplina,
        dados,
    )


@router.delete(
    "/{siMatricula}/{idOfertaDisciplina}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remover_cursamento(
    service: CursamentoServiceDep,
    siMatricula: int = Path(..., ge=1),
    idOfertaDisciplina: int = Path(..., ge=1),
):

    service.remover(
        siMatricula,
        idOfertaDisciplina,
    )

    return Response(status_code=status.HTTP_204_NO_CONTENT)