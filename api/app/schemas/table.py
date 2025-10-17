from pydantic import BaseModel, validator
from typing import Optional, List
from app.schemas.enums import TableStatus
from datetime import datetime

class TableBase(BaseModel):
    number: str

class TableCreate(TableBase):
    pos_x: Optional[int] = 0
    pos_y: Optional[int] = 0

class TableUpdate(BaseModel):
    number: Optional[str] = None
    status: Optional[TableStatus] = None
    pos_x: Optional[int] = None
    pos_y: Optional[int] = None

class Table(TableBase):
    id: int
    status: TableStatus
    pos_x: Optional[int] = 0
    pos_y: Optional[int] = 0
    store_id: int
    
    # --- NOVOS CAMPOS PARA O FRONTEND ---
    open_order_id: Optional[int] = None
    open_order_created_at: Optional[datetime] = None
    has_ready_items: bool = False

    class Config:
        from_attributes = True

    @validator('status', pre=True)
    def status_to_lowercase(cls, v):
        if isinstance(v, str):
            return v.lower()
        return v

class TableLayoutUpdate(BaseModel):
    id: int
    pos_x: int
    pos_y: int

class TableLayoutUpdateRequest(BaseModel):
    tables: List[TableLayoutUpdate]