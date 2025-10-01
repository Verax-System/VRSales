from pydantic import BaseModel, EmailStr
from typing import Optional

class CustomerBase(BaseModel):
    full_name: str
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(CustomerBase):
    full_name: Optional[str] = None

class Customer(CustomerBase):
    id: int

    class Config:
        from_attributes = True