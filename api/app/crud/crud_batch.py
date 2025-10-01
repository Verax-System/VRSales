from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import asc
from typing import List, Optional
from datetime import date

from app.models.batch import ProductBatch
from app.models.product import Product
from app.schemas.batch import ProductBatchCreate

async def create_product_batch(db: AsyncSession, batch_in: ProductBatchCreate) -> ProductBatch:
    """
    Cria um novo lote para um produto e atualiza o estoque consolidado do produto.
    """
    # 1. Valida se o produto existe
    product = await db.get(Product, batch_in.product_id)
    if not product:
        raise HTTPException(status_code=404, detail=f"Produto com ID {batch_in.product_id} não encontrado.")

    # 2. Cria o novo lote
    db_batch = ProductBatch(**batch_in.model_dump())
    db.add(db_batch)
    
    # 3. Atualiza o estoque consolidado do produto
    product.stock += batch_in.quantity
    
    await db.commit()
    await db.refresh(db_batch)
    return db_batch

async def get_batches(db: AsyncSession, expiring_soon_days: Optional[int] = None) -> List[ProductBatch]:
    """
    Lista todos os lotes.
    Se 'expiring_soon_days' for fornecido, filtra por lotes vencendo nos próximos X dias.
    """
    query = select(ProductBatch).order_by(asc(ProductBatch.expiration_date))
    
    if expiring_soon_days is not None:
        today = date.today()
        expiration_limit = today + timedelta(days=expiring_soon_days)
        query = query.where(
            ProductBatch.expiration_date >= today,
            ProductBatch.expiration_date <= expiration_limit
        )
        
    result = await db.execute(query)
    return result.scalars().all()

async def remove_batch(db: AsyncSession, batch_id: int) -> Optional[ProductBatch]:
    """ Remove um lote e atualiza o estoque consolidado do produto. """
    db_batch = await db.get(ProductBatch, batch_id)
    if db_batch:
        # Atualiza o estoque do produto antes de deletar
        product = await db.get(Product, db_batch.product_id)
        if product:
            product.stock -= db_batch.quantity

        await db.delete(db_batch)
        await db.commit()
    return db_batch