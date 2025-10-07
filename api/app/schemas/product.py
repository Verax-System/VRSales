# /api/app/schemas/product.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List # Adicione List
from .category import Category, Subcategory
from .variation import ProductVariation


class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    low_stock_threshold: int = 10 # <-- ADICIONE ESTA LINHA
    category_id: Optional[int] = None
    subcategory_id: Optional[int] = None
    image_url: Optional[str] = None
    barcode: Optional[str] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    low_stock_threshold: Optional[int] = None # <-- ADICIONE ESTA LINHA
    image_url: Optional[str] = None
    barcode: Optional[str] = None


class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Product(ProductInDBBase):
    category: Optional[Category] = None
    variations: List[ProductVariation] = [] 
    subcategory: Optional[Subcategory] = None
    pass