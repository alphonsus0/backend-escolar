from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.nota import (
    NotaCreateSchema,
    NotaResponseSchema,
    NotaUpdateSchema,
)
from app.services.nota_service import NotaService

router = APIRouter(
    prefix="/notas",
    tags=["notas"],
)


def get_nota_service(db: DbSession) -> NotaService:
    return NotaService(db)


NotaServiceDep = Annotated[
    NotaService,
    Depends(get_nota_service),
]


@router.get(
    "",
    response_model=list[NotaResponseSchema],
)
def listar_notas(
    service: NotaServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):

    return service.listar(skip, limit)


@router.get(
    "/{idNota}",
    response_model=NotaResponseSchema,
)
def buscar_nota(
    idNota: int = Path(..., ge=1),
    service: NotaServiceDep = None,
):

    return service.buscar_por_id(idNota)


@router.post(
    "",
    response_model=NotaResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def criar_nota(
    dados: NotaCreateSchema,
    service: NotaServiceDep,
):

    return service.criar(dados)


@router.put(
    "/{idNota}",
    response_model=NotaResponseSchema,
)
def atualizar_nota(
    dados: NotaUpdateSchema,
    service: NotaServiceDep,
    idNota: int = Path(..., ge=1),
):

    return service.atualizar(idNota, dados)


@router.delete(
    "/{idNota}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remover_nota(
    service: NotaServiceDep,
    idNota: int = Path(..., ge=1),
):

    service.remover(idNota)

    return Response(status_code=status.HTTP_204_NO_CONTENT)