from pydantic import BaseModel
from typing import Optional


class TurmaBaseSchema(BaseModel):
    nomeTurma: str
    turno: str
    serie: str
    salasTurma: str
    anoLetivo: int


class TurmaCreateSchema(TurmaBaseSchema):
    idTurma: int


class TurmaUpdateSchema(BaseModel):
    nomeTurma: Optional[str] = None
    turno: Optional[str] = None
    serie: Optional[str] = None
    salasTurma: Optional[str] = None
    anoLetivo: Optional[int] = None


class TurmaResponseSchema(TurmaBaseSchema):
    idTurma: int

    class Config:
        from_attributes = True
