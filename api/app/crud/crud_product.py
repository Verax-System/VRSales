from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional
from sqlalchemy import or_, desc, text

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
async def lookup_product(db: AsyncSession, query: str) -> List[Product]:
    """
    Busca rápida de produtos por nome (case-insensitive) ou código de barras exato.
    Se a busca for vazia, retorna os últimos produtos cadastrados.
    Otimizado para a tela de PDV e seletores.
    """
    if not query:
        # Se a busca for vazia, retorna os 10 produtos mais recentes.
        search_query = select(Product).order_by(desc(Product.created_at)).limit(10)
    else:
        # Se houver uma busca, executa a lógica de filtro.
        search_query = select(Product).where(
            or_(
                Product.name.ilike(f"%{query}%"),
                Product.barcode == query
            )
        ).limit(10)

    result = await db.execute(search_query)
    return result.scalars().all()

# --- FIM DA NOVA FUNÇÃO ---

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

async def get_low_stock_products(db: AsyncSession) -> List[Product]:
    """
    Retorna uma lista de produtos cujo estoque atual é menor ou igual ao 
    nível mínimo de estoque definido.
    """
    result = await db.execute(
        select(Product).where(Product.stock <= Product.low_stock_threshold)
    )
    return result.scalars().all()   