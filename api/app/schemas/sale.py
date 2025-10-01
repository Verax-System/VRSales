from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
from app.schemas.payment import Payment # <-- Adicione esta importação

# --- Schemas para Itens da Venda ---
class SaleItemBase(BaseModel):
    product_id: int
    quantity: int

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    price_at_sale: float

    class Config:
        from_attributes = True

# --- Schemas para a Venda ---
class SaleBase(BaseModel):
    customer_id: Optional[int] = None

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]

class Sale(SaleBase):
    id: int
    user_id: int
    total_amount: float
    created_at: datetime
    items: List[SaleItem] = []
    
    # --- INÍCIO DAS NOVAS LINHAS ---
    payments: List[Payment] = []
    change_amount: float = 0.0 # Campo para o troco
    # --- FIM DAS NOVAS LINHAS ---

    class Config:
        orm_mode = True