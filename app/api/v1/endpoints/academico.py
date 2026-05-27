from typing import Annotated

from fastapi import APIRouter, Body, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from app.api.deps import DbSession
from app.services.db_procedures import exec_proc

router = APIRouter(prefix="/academico", tags=["academico"])


class FecharSemestreSchema(BaseModel):
    anoLetivo: int = Field(..., ge=2000, le=2100)
    semestre: int = Field(..., ge=1, le=2)


@router.post(
    "/fechar-semestre",
    status_code=status.HTTP_200_OK,
    summary="Fechar semestre",
    description=(
        "Executa sp_FecharSemestre: recalcula médias finais de todos os "
        "cursamentos do período, marca ofertas como ENCERRADA e matrículas "
        "ATIVAs como FINALIZADA."
    ),
)
def fechar_semestre(
    payload: Annotated[FecharSemestreSchema, Body(...)],
    db: DbSession,
):
    exec_proc(db, "sp_FecharSemestre", {
        "anoLetivo": payload.anoLetivo,
        "semestre":  payload.semestre,
    })
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Semestre fechado com sucesso.",
            "anoLetivo": payload.anoLetivo,
            "semestre": payload.semestre,
        },
    )
