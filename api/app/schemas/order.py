from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# Importa os Enums que definem os tipos e status
from app.schemas.enums import OrderType, OrderStatus
from app.schemas.product import Product
from app.schemas.user import User

class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    notes: Optional[str] = None

class OrderItemCreate(OrderItemBase):
    pass

class OrderItem(OrderItemBase):
    id: int
    price_at_order: float
    product: Optional[Product] = None
    class Config:
        orm_mode = True

class OrderBase(BaseModel):
    # O campo 'order_type' é obrigatório para a lógica funcionar.
    order_type: OrderType
    
    customer_id: Optional[int] = None
    table_id: Optional[int] = None
    delivery_address: Optional[str] = None

class OrderCreate(OrderBase):
    pass

class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    customer_id: Optional[int] = None

class Order(OrderBase):
    id: int
    status: OrderStatus
    created_at: datetime
    user: Optional[User] = None
    items: List[OrderItem] = []
    class Config:
        orm_mode = True