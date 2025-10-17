from pydantic import BaseModel, validator
from typing import Optional, List
from app.schemas.enums import TableStatus # Reutilizaremos nosso arquivo de enums

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
    store_id: int # Adicionando store_id para consistência

    class Config:
        from_attributes = True

    # --- INÍCIO DA CORREÇÃO ---
    # Este 'validador' é a solução. Ele é executado antes da validação padrão.
    # Ele pega o valor do campo 'status' (ex: "AVAILABLE") e o converte
    # para minúsculas ("available") antes que o Pydantic tente validá-lo.
    @validator('status', pre=True)
    def status_to_lowercase(cls, v):
        if isinstance(v, str):
            return v.lower()
        return v
    # --- FIM DA CORREÇÃO ---


# Novo schema para atualização em lote do layout
class TableLayoutUpdate(BaseModel):
    id: int
    pos_x: int
    pos_y: int

class TableLayoutUpdateRequest(BaseModel):
    tables: List[TableLayoutUpdate]