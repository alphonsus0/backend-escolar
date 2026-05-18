from pydantic import ConfigDict

# Substitui orm_mode=True do Pydantic v1 (leitura a partir de models SQLAlchemy).
ORM_MODEL_CONFIG = ConfigDict(from_attributes=True)
