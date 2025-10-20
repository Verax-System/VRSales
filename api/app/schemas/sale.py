from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime

# Importa os schemas que serão aninhados na resposta
from .sale_item import SaleItem, SaleItemCreate
from .payment import PaymentCreate, Payment as PaymentSchema # 1. IMPORTAR O SCHEMA DE PAGAMENTO COMPLETO
from .user import User
from .customer import Customer

# =====================================================================================
# Schema Base e de Criação
# =====================================================================================
class SaleBase(BaseModel):
    total_amount: float = Field(..., gt=0, description="Valor total da venda.")
    customer_id: Optional[int] = None

class SaleCreate(SaleBase):
    items: List[SaleItemCreate]
    payments: List[PaymentCreate]

class SaleUpdate(BaseModel):
    pass

# =====================================================================================
# Schema para Leitura/Retorno da Venda (COM DETALHES COMPLETOS)
# =====================================================================================
class Sale(SaleBase):
    id: int
    user_id: int
    created_at: datetime
    payment_method: str # Mantemos para um resumo rápido ou compatibilidade

    items: List[SaleItem] = []
    user: Optional[User] = None
    customer: Optional[Customer] = None

    # --- CORREÇÃO PRINCIPAL AQUI ---
    # Adicionamos a lista de pagamentos detalhados à resposta da API.
    # O 'crud_sale.py' já carrega esta informação do banco, só faltava expô-la aqui.
    payments: List[PaymentSchema] = []
    # --- FIM DA CORREÇÃO ---

    model_config = ConfigDict(from_attributes=True)