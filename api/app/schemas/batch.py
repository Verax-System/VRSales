from pydantic import BaseModel, ConfigDict
from datetime import date, datetime
from typing import Optional

# Schema auxiliar para carregar apenas nome e ID do produto
class ProductInfo(BaseModel):
    id: int
    name: str

    model_config = ConfigDict(from_attributes=True)


class ProductBatchBase(BaseModel):
    product_id: int
    quantity: float
    expiration_date: Optional[date] = None

class ProductBatchCreate(ProductBatchBase):
    pass

class ProductBatch(ProductBatchBase):
    id: int
    created_at: datetime
    product: Optional[ProductInfo] = None # <-- Relacionamento para exibir o nome

    # Substitui a 'class Config' obsoleta pela nova sintaxe do Pydantic V2
    model_config = ConfigDict(from_attributes=True)