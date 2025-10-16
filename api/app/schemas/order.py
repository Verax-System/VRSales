from pydantic import BaseModel, field_validator, ValidationInfo
from datetime import datetime
from typing import List, Optional

from app.schemas.enums import OrderStatus, OrderType, OrderItemStatus
from app.schemas.additional import Additional
from .product import Product

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
    status: OrderItemStatus
    additionals: List[Additional] = []
    product: Product

    class Config:
        from_attributes = True

# --- Pedido/Comanda ---

class OrderCreate(BaseModel):
    order_type: OrderType
    table_id: Optional[int] = None
    customer_id: Optional[int] = None
    delivery_address: Optional[str] = None

    @field_validator('table_id')
    @classmethod
    def check_table_id(cls, v: int, info: ValidationInfo) -> int:
        if info.data.get('order_type') == OrderType.DINE_IN and v is None:
            raise ValueError('table_id é obrigatório para pedidos do tipo DINE_IN')
        return v

    @field_validator('customer_id', 'delivery_address')
    @classmethod
    def check_delivery_info(cls, v: str, info: ValidationInfo) -> str:
        if info.data.get('order_type') == OrderType.DELIVERY and v is None:
            # Pega o nome do campo que está sendo validado a partir do 'info'
            field_name = info.field_name
            raise ValueError(f'{field_name} é obrigatório para pedidos do tipo DELIVERY')
        return v

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
        from_attributes = True