from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional

class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierUpdate(SupplierBase):
    pass

class Supplier(SupplierBase):
    id: int
    store_id: int

    # Substitui a 'class Config' obsoleta pela nova sintaxe do Pydantic V2
    model_config = ConfigDict(from_attributes=True)