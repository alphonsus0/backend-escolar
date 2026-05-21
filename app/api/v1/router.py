from fastapi import APIRouter

from app.api.v1.endpoints import (
    alunos,
    professores,
    disciplinas,
    turmas,
    matriculas,
    ofertas,
    avaliacoes,
    cursamentos,
    notas,
    auth,
    health,
)

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)

api_router.include_router(alunos.router)
api_router.include_router(professores.router)
api_router.include_router(disciplinas.router)
api_router.include_router(turmas.router)
api_router.include_router(matriculas.router)
api_router.include_router(ofertas.router)
api_router.include_router(avaliacoes.router)
api_router.include_router(cursamentos.router)
api_router.include_router(notas.router)
