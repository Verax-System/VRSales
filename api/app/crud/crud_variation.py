from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.models.product_variation import ProductVariation
from app.models.variation import AttributeOption
from app.schemas.variation import ProductVariationCreate

async def create_product_variation(db: AsyncSession, variation_in: ProductVariationCreate, product_id: int) -> ProductVariation:
    """
    Cria uma nova variação (SKU) para um produto.
    """
    # 1. Cria a instância da variação com preço, estoque, etc.
    db_variation = ProductVariation(
        product_id=product_id,
        price=variation_in.price,
        stock=variation_in.stock,
        barcode=variation_in.barcode
    )
    
    # 2. Busca os objetos das opções de atributo com base nos IDs fornecidos
    if variation_in.option_ids:
        result = await db.execute(select(AttributeOption).where(AttributeOption.id.in_(variation_in.option_ids)))
        options = result.scalars().all()
        if len(options) != len(variation_in.option_ids):
            raise ValueError("Uma ou mais opções de atributo não foram encontradas.")
        
        # 3. Associa as opções à nova variação
        db_variation.options.extend(options)
        
    db.add(db_variation)
    await db.commit()
    await db.refresh(db_variation)
    return db_variation