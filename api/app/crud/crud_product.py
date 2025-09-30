from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate

# Função para obter um único produto pelo ID
async def get_product(db: AsyncSession, product_id: int) -> Optional[Product]:
    result = await db.execute(select(Product).filter(Product.id == product_id))
    return result.scalars().first()

# Função para obter uma lista de produtos com paginação
async def get_products(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Product]:
    result = await db.execute(select(Product).offset(skip).limit(limit))
    return result.scalars().all()

# Função para criar um novo produto no banco de dados
async def create_product(db: AsyncSession, product: ProductCreate) -> Product:
    # Cria uma nova instância do modelo Product com os dados do schema
    db_product = Product(**product.model_dump())
    db.add(db_product)
    await db.commit() # Salva a transação no banco
    await db.refresh(db_product) # Atualiza o objeto com os dados do banco (como o ID gerado)
    return db_product
