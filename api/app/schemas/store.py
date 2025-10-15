from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class StoreBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=100)
    address: Optional[str] = Field(None, max_length=255)

class StoreCreate(StoreBase):
    pass

class StoreUpdate(StoreBase):
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    is_active: Optional[bool] = None

class Store(StoreBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        orm_mode = True