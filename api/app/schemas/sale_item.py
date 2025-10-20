from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

# 1. Importa o schema do produto para poder aninhá-lo
from .product import Product

class SaleItemBase(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    price_at_sale: float = Field(..., gt=0)

class SaleItemCreate(SaleItemBase):
    pass

class SaleItem(SaleItemBase):
    id: int
    sale_id: int

    # --- CORREÇÃO PRINCIPAL AQUI ---
    # Adicionamos o campo 'product' que será populado pelo SQLAlchemy
    # graças ao 'joinedload' que já configuramos no crud_sale.py.
    # Ele pode ser opcional para o caso de um produto ter sido deletado do sistema.
    product: Optional[Product] = None
    # --- FIM DA CORREÇÃO ---


    # Substitui a 'class Config' obsoleta pela nova sintaxe do Pydantic V2
    model_config = ConfigDict(from_attributes=True)