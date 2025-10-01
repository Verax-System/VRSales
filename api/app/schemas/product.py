from pydantic import BaseModel
from datetime import datetime
from typing import Optional

# Schema base para as propriedades do produto
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    stock: int
    image_url: Optional[str] = None
    barcode: Optional[str] = None


# Schema para a criação de um produto (recebido via API)
class ProductCreate(ProductBase):
    image_url: Optional[str] = None
    barcode: Optional[str] = None

    pass # Herda todos os campos de ProductBase

# Schema para a atualização de um produto (recebido via API)
class ProductUpdate(ProductBase):
    # Todos os campos são opcionais na atualização
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    image_url: Optional[str] = None
    barcode: Optional[str] = None


# Propriedades que são compartilhadas por todos os schemas que
# representam um produto no banco de dados.
class ProductInDBBase(ProductBase):
    id: int
    created_at: datetime
    updated_at: datetime
    

    # Configuração para permitir que o Pydantic funcione com modelos ORM do SQLAlchemy
    class Config:
        from_attributes = True

# Schema final para retornar um produto da API para o cliente.
# Este é o modelo que será usado nas respostas da API.
class Product(ProductInDBBase):
    pass
