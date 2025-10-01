from pydantic import BaseModel
from typing import List, Optional

from app.schemas.enums import PaymentMethod

class PaymentBase(BaseModel):
    payment_method: PaymentMethod
    amount: float

class PaymentCreate(PaymentBase):
    pass

class Payment(PaymentBase):
    id: int
    sale_id: int

    class Config:
        orm_mode = True

# Novo schema para o corpo da requisição de pagamento
class OrderPaymentRequest(BaseModel):
    payments: List[PaymentCreate]
    customer_id: Optional[int] = None