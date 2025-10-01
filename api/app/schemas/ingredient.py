from pydantic import BaseModel, Field
from typing import Optional
from app.schemas.enums import UnitOfMeasure # <-- CORREÇÃO AQUI

class IngredientBase(BaseModel):
    name: str
    unit_of_measure: UnitOfMeasure

class IngredientCreate(IngredientBase):
    stock: float = Field(0.0, ge=0)

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    unit_of_measure: Optional[UnitOfMeasure] = None

class Ingredient(IngredientBase):
    id: int
    stock: float

    class Config:
        from_attributes = True

class IngredientStockUpdate(BaseModel):
    """ Schema para dar entrada/saída manual de estoque. """
    quantity: float