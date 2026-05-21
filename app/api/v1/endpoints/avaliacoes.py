from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query, Response, status

from app.api.deps import DbSession
from app.schemas.avaliacao import (
    AvaliacaoCreateSchema,
    AvaliacaoResponseSchema,
    AvaliacaoUpdateSchema,
)
from app.services.avaliacao_service import AvaliacaoService

router = APIRouter(
    prefix="/avaliacoes",
    tags=["avaliacoes"],
)


def get_avaliacao_service(db: DbSession) -> AvaliacaoService:
    return AvaliacaoService(db)


AvaliacaoServiceDep = Annotated[
    AvaliacaoService,
    Depends(get_avaliacao_service),
]

AvaliacaoIdPath = Annotated[
    int,
    Path(
        ge=1,
        description="ID da avaliação",
    ),
]


@router.get(
    "",
    response_model=list[AvaliacaoResponseSchema],
    summary="Listar avaliações",
    description="Retorna avaliações cadastradas com paginação.",
)
def listar_avaliacoes(
    service: AvaliacaoServiceDep,
    skip: int = Query(
        0,
        ge=0,
        description="Registros a ignorar",
    ),
    limit: int = Query(
        100,
        ge=1,
        le=500,
        description="Quantidade máxima de registros",
    ),
) -> list[AvaliacaoResponseSchema]:

    avaliacoes = service.listar(skip=skip, limit=limit)

    return [
        AvaliacaoResponseSchema.model_validate(avaliacao)
        for avaliacao in avaliacoes
    ]


@router.get(
    "/{id}",
    response_model=AvaliacaoResponseSchema,
    summary="Buscar avaliação por ID",
    description="Busca avaliação pelo idAvaliacao.",
)
def buscar_avaliacao(
    id: AvaliacaoIdPath,
    service: AvaliacaoServiceDep,
) -> AvaliacaoResponseSchema:

    avaliacao = service.buscar_por_id(id)

    return AvaliacaoResponseSchema.model_validate(avaliacao)


@router.post(
    "",
    response_model=AvaliacaoResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Criar avaliação",
    description="Cria uma nova avaliação.",
)
def criar_avaliacao(
    dados: AvaliacaoCreateSchema,
    service: AvaliacaoServiceDep,
) -> AvaliacaoResponseSchema:

    avaliacao = service.criar(dados)

    return AvaliacaoResponseSchema.model_validate(avaliacao)


@router.put(
    "/{id}",
    response_model=AvaliacaoResponseSchema,
    summary="Atualizar avaliação",
    description="Atualiza parcialmente os dados da avaliação.",
)
def atualizar_avaliacao(
    id: AvaliacaoIdPath,
    dados: AvaliacaoUpdateSchema,
    service: AvaliacaoServiceDep,
) -> AvaliacaoResponseSchema:

    avaliacao = service.atualizar(id, dados)

    return AvaliacaoResponseSchema.model_validate(avaliacao)


@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remover avaliação",
    description="Remove avaliação cadastrada.",
)
def remover_avaliacao(
    id: AvaliacaoIdPath,
    service: AvaliacaoServiceDep,
) -> Response:

    service.remover(id)

    return Response(status_code=status.HTTP_204_NO_CONTENT)