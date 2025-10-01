from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

# --- INÍCIO DA CORREÇÃO ---
# Importa do arquivo de Enums, não do modelo
from app.schemas.enums import OrderStatus, OrderType 
from app.schemas.additional import Additional
# --- FIM DA CORREÇÃO ---


# --- Item do Pedido ---
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    notes: Optional[str] = None
    additional_ids: List[int] = []

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    price_at_order: float
    additionals: List[Additional] = []

    class Config:
        orm_mode = True

# --- Pedido/Comanda ---
class OrderCreateTable(BaseModel):
    table_id: int

class OrderCreateDelivery(BaseModel):
    customer_id: int
    delivery_address: str

class OrderUpdate(BaseModel):
    status: OrderStatus

class Order(BaseModel):
    id: int
    status: OrderStatus
    order_type: OrderType
    table_id: Optional[int] = None
    customer_id: Optional[int] = None
    delivery_address: Optional[str] = None
    created_at: datetime
    items: List[OrderItem] = []
    total_amount: float = 0.0

    class Config:
        orm_mode = True