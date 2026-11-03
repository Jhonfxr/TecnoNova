from pydantic import BaseModel, Field
class SistemaCreate(BaseModel):
    nombre: str = Field(min_length=1, max_length=200)
    descripcion: str | None = None
class ElementoCreate(SistemaCreate):
    sistema_id: int = Field(gt=0)
