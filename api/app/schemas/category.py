from pydantic import BaseModel, Field
from typing import List, Optional

# --- Schema para Subcategoria ---
class ProductSubcategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class ProductSubcategoryCreate(ProductSubcategoryBase):
    pass

class ProductSubcategory(ProductSubcategoryBase):
    id: int
    parent_category_id: int

    class Config:
        from_attributes = True # Atualizado de orm_mode

# --- Schema para Categoria Principal ---
class ProductCategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)

class ProductCategoryCreate(ProductCategoryBase):
    pass

# --- CLASSE ADICIONADA AQUI ---
class ProductCategoryUpdate(ProductCategoryBase):
    pass # Permite atualizar os mesmos campos da base (neste caso, 'name')

class ProductCategory(ProductCategoryBase):
    id: int
    subcategories: List[ProductSubcategory] = []

    class Config:
        from_attributes = True # Atualizado de orm_mode