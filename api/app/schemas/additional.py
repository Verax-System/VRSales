from pydantic import BaseModel
from typing import Optional

class AdditionalBase(BaseModel):
    name: str
    price: float

class AdditionalCreate(AdditionalBase):
    pass

class Additional(AdditionalBase):
    id: int

    class Config:
        from_attributes = True