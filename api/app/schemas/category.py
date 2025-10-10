from pydantic import BaseModel
from typing import List, Optional

class SubcategoryBase(BaseModel):
    name: str

class SubcategoryCreate(SubcategoryBase):
    pass

class Subcategory(SubcategoryBase):
    id: int

    class Config:
        from_attributes = True # Correção aqui

class CategoryBase(BaseModel):
    name: str

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: int
    subcategories: List[Subcategory] = []

    class Config:
        from_attributes = True # Correção aqui