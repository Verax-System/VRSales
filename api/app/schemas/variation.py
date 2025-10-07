from pydantic import BaseModel
from typing import List, Optional

# --- Schemas para Atributos (ex: Cor, Tamanho) ---

class AttributeBase(BaseModel):
    name: str

class AttributeCreate(AttributeBase):
    pass

class AttributeOptionBase(BaseModel):
    value: str

class AttributeOptionCreate(AttributeOptionBase):
    pass

class AttributeOption(AttributeOptionBase):
    id: int
    attribute_id: int

    class Config:
        from_attributes = True

class Attribute(AttributeBase):
    id: int
    options: List[AttributeOption] = []

    class Config:
        from_attributes = True


# --- Schemas para Variações de Produto (SKUs) ---

class ProductVariationBase(BaseModel):
    price: float
    stock: int
    barcode: Optional[str] = None
    option_ids: List[int] = []

class ProductVariationCreate(ProductVariationBase):
    pass

class ProductVariation(ProductVariationBase):
    id: int
    product_id: int
    options: List[AttributeOption] = []

    class Config:
        from_attributes = True