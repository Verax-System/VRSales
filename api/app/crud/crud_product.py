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
    db_product = Product(**product.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

# --- INÍCIO DO NOVO CÓDIGO ---

# Função para atualizar um produto existente
async def update_product(db: AsyncSession, db_product: Product, product_in: ProductUpdate) -> Product:
    update_data = product_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

# Função para remover um produto
async def remove_product(db: AsyncSession, product_id: int) -> Optional[Product]:
    result = await db.execute(select(Product).filter(Product.id == product_id))
    db_product = result.scalars().first()
    if db_product:
        await db.delete(db_product)
        await db.commit()
    return db_product

# --- FIM DO NOVO CÓDIGO ---