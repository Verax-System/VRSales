from pydantic import BaseModel
from typing import List

class RecipeItemBase(BaseModel):
    ingredient_id: int
    quantity_needed: float

class RecipeItemCreate(RecipeItemBase):
    pass

class RecipeItem(RecipeItemBase):
    id: int
    
    class Config:
        from_attributes = True

class RecipeUpdate(BaseModel):
    """ Schema para atualizar a ficha técnica completa de um produto. """
    items: List[RecipeItemCreate]