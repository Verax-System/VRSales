from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# Importa o schema do item da venda, que precisa ser criado ou verificado
from .sale_item import SaleItem  # Supondo que você tenha ou crie este schema

# =====================================================================================
# Schema Base e de Criação (mantenha como está ou refatore se necessário)
# =====================================================================================
class SaleBase(BaseModel):
    total_amount: float = Field(..., gt=0, description="Valor total da venda.")
    payment_method: str = Field(..., max_length=50, description="Método de pagamento principal.")
    customer_id: Optional[int] = None
    user_id: int

class SaleCreate(SaleBase):
    items: List[SaleItem] # Itens que compõem a venda

class SaleUpdate(BaseModel):
    # Por agora, não permitiremos a atualização de nenhum campo da venda.
    # Se fosse necessário, os campos opcionais viriam aqui.
    pass
# =====================================================================================
# Schema para Leitura/Retorno da Venda (COM DETALHES PARA O HISTÓRICO)
# =====================================================================================
class Sale(SaleBase):
    id: int
    created_at: datetime
    
    # --- INÍCIO DA ATUALIZAÇÃO ---
    # Inclui a lista de itens da venda na resposta da API
    # Isso é essencial para exibir o histórico de compras detalhado.
    items: List[SaleItem] = []
    # --- FIM DA ATUALIZAÇÃO ---

    class Config:
        orm_mode = True

# --- INÍCIO DA CRIAÇÃO ---
# Se o schema SaleItem não existir, crie-o.
# Novo arquivo: api/app/schemas/sale_item.py
"""
from pydantic import BaseModel, Field

class SaleItem(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    price_at_sale: float = Field(..., gt=0)

    class Config:
        orm_mode = True
"""
# --- FIM DA CRIAÇÃO ---