from pydantic import BaseModel, Field
from typing import List, Optional

# Schema para Subcategoria (usado dentro do schema de Categoria)
class ProductSubcategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class ProductSubcategoryCreate(ProductSubcategoryBase):
    pass

class ProductSubcategory(ProductSubcategoryBase):
    id: int
    parent_category_id: int

    class Config:
        orm_mode = True

# Schema para Categoria Principal
class ProductCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class ProductCategoryCreate(ProductCategoryBase):
    pass

class ProductCategory(ProductCategoryBase):
    id: int
    subcategories: List[ProductSubcategory] = []

    class Config:
        orm_mode = True