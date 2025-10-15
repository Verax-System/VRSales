from pydantic import BaseModel, Field
from typing import Optional

class StockAdjustment(BaseModel):
    new_stock_level: int = Field(..., ge=0, description="A nova quantidade total em estoque para o produto.")
    reason: str = Field(..., min_length=5, max_length=255, description="A justificativa para o ajuste de estoque.")