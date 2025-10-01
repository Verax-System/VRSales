from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from .category import Category, Subcategory # <-- Adicione esta importação
from .variation import ProductVariation # <-- Adicione esta importação


# Schema base com os campos que um produto sempre terá
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    image_url: Optional[str] = None
    barcode: Optional[str] = None

# Schema para a criação de um produto (o que a API recebe no POST)
class ProductCreate(ProductBase):
    pass

# Schema para a atualização de um produto (o que a API recebe no PUT/PATCH)
class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    barcode: Optional[str] = None

# Propriedades que são lidas do banco de dados
class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Schema final para retornar um produto da API para o cliente
class Product(ProductInDBBase):
    category: Optional[Category] = None
    variations: List[ProductVariation] = [] # Para retornar o produto com suas variações
    subcategory: Optional[Subcategory] = None
    pass