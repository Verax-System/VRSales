from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional

class ProductBatchBase(BaseModel):
    product_id: int
    quantity: float
    expiration_date: Optional[date] = None

class ProductBatchCreate(ProductBatchBase):
    pass

class ProductBatch(ProductBatchBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True