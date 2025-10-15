from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    """Operações CRUD para Produtos."""
    # Se houver alguma lógica específica de produto (ex: buscar por código de barras),
    # ela seria adicionada aqui. Por enquanto, a classe base já faz tudo.
    pass

product = CRUDProduct(Product)