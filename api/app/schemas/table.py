from pydantic import BaseModel
from typing import Optional
from app.schemas.enums import TableStatus # Reutilizaremos nosso arquivo de enums

class TableBase(BaseModel):
    number: str

class TableCreate(TableBase):
    pass

class TableUpdate(BaseModel):
    number: Optional[str] = None
    status: Optional[TableStatus] = None

class Table(TableBase):
    id: int
    status: TableStatus

    class Config:
        from_attributes = True