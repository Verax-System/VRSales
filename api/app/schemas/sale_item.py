from pydantic import BaseModel, Field

class SaleItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    price_at_sale: float = Field(..., gt=0)

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    sale_id: int

    class Config:
        orm_mode = True