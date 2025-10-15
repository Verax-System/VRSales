from pydantic import Field, EmailStr, validator
from typing import Optional
from datetime import datetime

# Importa o nosso BaseSchema e os enums necessários
from .base_schema import BaseSchema
from .enums import UserRole

# =====================================================================================
# Schema Base para Usuário
# =====================================================================================
class UserBase(BaseSchema):
    """Schema base contendo os campos comuns de um usuário."""
    full_name: str = Field(
        ..., 
        min_length=3, 
        max_length=100,
        description="Nome completo do usuário."
    )
    email: EmailStr = Field(
        ...,
        description="E-mail de login do usuário. Deve ser um e-mail válido e único."
    )
    role: UserRole = Field(
        UserRole.CASHIER, # Define 'cashier' como o cargo padrão
        description="Define o nível de permissão do usuário no sistema."
    )
    is_active: bool = Field(
        True,
        description="Indica se o usuário está ativo no sistema. Inativos não podem logar."
    )

# =====================================================================================
# Schema para Criação de Usuário
# =====================================================================================
class UserCreate(UserBase):
    """Schema usado para criar um novo usuário."""
    password: str = Field(
        ..., 
        min_length=8,
        description="Senha do usuário. Deve ter no mínimo 8 caracteres."
    )

    @validator('password')
    def validate_password_strength(cls, v):
        """Validador para garantir uma senha minimamente segura."""
        if len(v) < 8:
            raise ValueError('A senha deve ter pelo menos 8 caracteres.')
        # Você pode adicionar mais regras aqui (ex: letras maiúsculas, números, símbolos)
        # if not any(char.isdigit() for char in v):
        #     raise ValueError('A senha deve conter pelo menos um número.')
        # if not any(char.isupper() for char in v):
        #     raise ValueError('A senha deve conter pelo menos uma letra maiúscula.')
        return v

# =====================================================================================
# Schema para Atualização de Usuário
# =====================================================================================
class UserUpdate(BaseSchema):
    """
    Schema para atualizar um usuário. Todos os campos são opcionais.
    Não permite a atualização direta da senha por este schema por segurança.
    """
    full_name: Optional[str] = Field(None, min_length=3, max_length=100)
    email: Optional[EmailStr] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    store_id: int = Field(..., description="ID da loja à qual o usuário pertence.")

# =====================================================================================
# Schema para Leitura/Retorno de Usuário da API
# =====================================================================================
class User(UserBase):
    """Schema completo do usuário, usado para retornar dados da API."""
    id: int
    created_at: datetime

    class Config:
        orm_mode = True