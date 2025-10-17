# api/app/schemas/reservation.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

from .table import Table as TableSchema

class ReservationBase(BaseModel):
    customer_name: str = Field(..., min_length=2, max_length=150)
    phone_number: Optional[str] = None
    reservation_time: datetime
    number_of_people: int = Field(..., gt=0)
    notes: Optional[str] = None
    table_id: int

class ReservationCreate(ReservationBase):
    pass

class ReservationUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone_number: Optional[str] = None
    reservation_time: Optional[datetime] = None
    number_of_people: Optional[int] = Field(None, gt=0)
    notes: Optional[str] = None
    table_id: Optional[int] = None
    status: Optional[str] = None

class Reservation(ReservationBase):
    id: int
    store_id: int
    status: str
    created_at: datetime
    table: TableSchema # Inclui os detalhes da mesa

    class Config:
        from_attributes = True