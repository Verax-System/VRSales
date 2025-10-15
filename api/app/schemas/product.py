from pydantic import Field, validator
from typing import Optional, List
from datetime import datetime

# Importa o nosso novo BaseSchema
from .base_schema import BaseSchema
from .category import ProductCategory, ProductSubcategory
from .variation import ProductVariation

# =====================================================================================
# Schema Base para Produto
# =====================================================================================
class ProductBase(BaseSchema):
    """Schema base contendo os campos comuns de um produto."""
    name: str = Field(
        ..., 
        min_length=3, 
        max_length=100,
        description="Nome do produto. Deve ter entre 3 e 100 caracteres."
    )
    description: Optional[str] = Field(
        None, 
        max_length=255,
        description="Descrição detalhada do produto."
    )
    price: float = Field(
        ..., 
        gt=0, # gt = Greater Than (maior que)
        description="Preço de venda do produto. Deve ser um valor positivo."
    )
    stock: int = Field(
        ..., 
        ge=0, # ge = Greater Than or Equal (maior ou igual a)
        description="Quantidade em estoque do produto. Não pode ser negativo."
    )
    low_stock_threshold: int = Field(
        10, 
        ge=0,
        description="Limite para alerta de estoque baixo. Padrão é 10."
    )
    image_url: Optional[str] = Field(
        None, 
        max_length=500,
        description="URL da imagem do produto."
    )
    barcode: Optional[str] = Field(
        None, 
        max_length=100,
        index=True,
        description="Código de barras do produto (EAN, UPC, etc.)."
    )
    category_id: Optional[int] = Field(
        None,
        description="ID da categoria principal do produto."
    )
    subcategory_id: Optional[int] = Field(
        None,
        description="ID da subcategoria do produto."
    )
    
    @validator('name')
    def name_must_not_be_empty(cls, value):
        """Validador para garantir que o nome não seja uma string vazia."""
        if not value.strip():
            raise ValueError('O nome do produto não pode ser vazio.')
        return value

# =====================================================================================
# Schema para Criação de Produto
# =====================================================================================
class ProductCreate(ProductBase):
    """Schema usado para criar um novo produto no sistema."""
    # Herda todos os campos e validações de ProductBase
    pass

# =====================================================================================
# Schema para Atualização de Produto
# =====================================================================================
class ProductUpdate(ProductBase):
    """
    Schema usado para atualizar um produto existente.
    Todos os campos são opcionais na atualização.
    """
    name: Optional[str] = Field(None, min_length=3, max_length=100)
    price: Optional[float] = Field(None, gt=0)
    stock: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    category: Optional[ProductCategory] = None
    subcategory: Optional[ProductSubcategory] = None

# =====================================================================================
# Schema para Leitura/Retorno de Produto da API
# =====================================================================================
class Product(ProductBase):
    """
    Schema completo do produto, usado para retornar dados da API.
    Inclui campos de somente leitura como ID e timestamps.
    """
    id: int
    created_at: datetime
    updated_at: datetime
    
    # Relacionamentos (carregados via ORM)
    category: Optional[ProductCategory] = None
    variations: List[ProductVariation] = []

    class Config:
        orm_mode = True