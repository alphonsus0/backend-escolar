from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.ofertaDisciplina import (
    OfertaDisciplinaCreateSchema,
    OfertaDisciplinaResponseSchema,
    OfertaDisciplinaUpdateSchema,
)
from app.services.ofertaDisciplina_service import OfertaDisciplinaService

router = APIRouter(prefix="/ofertas", tags=["ofertas"])


def get_oferta_service(db: DbSession) -> OfertaDisciplinaService:
    return OfertaDisciplinaService(db)


OfertaServiceDep = Annotated[
    OfertaDisciplinaService,
    Depends(get_oferta_service)
]

OfertaIdPath = Annotated[
    int,
    Path(ge=1, description="ID da oferta")
]


@router.get("", response_model=list[OfertaDisciplinaResponseSchema])
def listar_ofertas(
    service: OfertaServiceDep,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
):
    ofertas = service.listar(skip=skip, limit=limit)
    return [
        OfertaDisciplinaResponseSchema.model_validate(oferta)
        for oferta in ofertas
    ]


@router.get("/{id}", response_model=OfertaDisciplinaResponseSchema)
def buscar_oferta(
    id: OfertaIdPath,
    service: OfertaServiceDep,
):
    oferta = service.buscar_por_id(id)
    return OfertaDisciplinaResponseSchema.model_validate(oferta)


@router.post(
    "",
    response_model=OfertaDisciplinaResponseSchema,
    status_code=status.HTTP_201_CREATED,
)
def criar_oferta(
    dados: OfertaDisciplinaCreateSchema,
    service: OfertaServiceDep,
):
    oferta = service.criar(dados)
    return OfertaDisciplinaResponseSchema.model_validate(oferta)


@router.put("/{id}", response_model=OfertaDisciplinaResponseSchema)
def atualizar_oferta(
    id: OfertaIdPath,
    dados: OfertaDisciplinaUpdateSchema,
    service: OfertaServiceDep,
):
    oferta = service.atualizar(id, dados)
    return OfertaDisciplinaResponseSchema.model_validate(oferta)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_oferta(
    id: OfertaIdPath,
    service: OfertaServiceDep,
):
    service.remover(id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)