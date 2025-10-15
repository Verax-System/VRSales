from pydantic import Field, EmailStr, validator
from typing import Optional
from datetime import datetime

from .base_schema import BaseSchema
import re

# =====================================================================================
# Schema Base para Cliente
# =====================================================================================
class CustomerBase(BaseSchema):
    """Schema base contendo os campos comuns de um cliente."""
    full_name: str = Field(
        ..., 
        min_length=3, 
        max_length=150,
        description="Nome completo do cliente."
    )
    phone_number: Optional[str] = Field(
        None,
        max_length=20,
        description="Número de telefone do cliente (com DDD)."
    )
    email: Optional[EmailStr] = Field(
        None,
        description="E-mail do cliente."
    )
    document_number: Optional[str] = Field(
        None,
        max_length=18,
        description="Número do documento (CPF ou CNPJ)."
    )
    
    @validator('phone_number')
    def format_phone_number(cls, v):
        if v is None:
            return v
        return re.sub(r'\D', '', v)
    
    @validator('document_number')
    def format_document_number(cls, v):
        if v is None:
            return v
        return re.sub(r'\D', '', v)

# =====================================================================================
# Schema para Criação e Atualização
# =====================================================================================
class CustomerCreate(CustomerBase):
    """Schema usado para registrar um novo cliente."""
    pass

class CustomerUpdate(CustomerBase):
    full_name: Optional[str] = Field(None, min_length=3, max_length=150)

# =====================================================================================
# Schema para Leitura/Retorno de Cliente da API
# =====================================================================================
class Customer(CustomerBase):
    """Schema completo do cliente para retorno da API."""
    id: int
    created_at: datetime
    updated_at: datetime

    # --- INÍCIO DA ATUALIZAÇÃO ---
    # Adiciona os novos campos de CRM para que sejam retornados pela API
    last_seen: Optional[datetime]
    total_spent: float
    loyalty_points: int
    # --- FIM DA ATUALIZAÇÃO ---

    class Config:
        orm_mode = True