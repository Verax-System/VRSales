from pydantic import BaseModel
from typing import Optional, List
from app.schemas.enums import TableStatus # Reutilizaremos nosso arquivo de enums

class TableBase(BaseModel):
    number: str

class TableCreate(TableBase):
    pass

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

    class Config:
        from_attributes = True

# Novo schema para atualização em lote do layout
class TableLayoutUpdate(BaseModel):
    id: int
    pos_x: int
    pos_y: int

class TableLayoutUpdateRequest(BaseModel):
    tables: List[TableLayoutUpdate]