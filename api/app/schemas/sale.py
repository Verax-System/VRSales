from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional
# --- INÍCIO DA CORREÇÃO ---
# Importa o schema de criação de pagamento
from app.schemas.payment import Payment, PaymentCreate
# --- FIM DA CORREÇÃO ---

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
    # --- INÍCIO DA CORREÇÃO ---
    # Adiciona o campo para receber os pagamentos do frontend
    payments: List[PaymentCreate]
    # --- FIM DA CORREÇÃO ---


class Sale(SaleBase):
    id: int
    user_id: int
    total_amount: float
    created_at: datetime
    items: List[SaleItem] = []
    
    payments: List[Payment] = []
    change_amount: float = 0.0 # Campo para o troco

    class Config:
        from_attributes = True # Alterado de orm_mode para from_attributes