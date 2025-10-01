from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete

from app.models.recipe import RecipeItem
from app.models.product import Product
from app.schemas.recipe import RecipeUpdate

async def update_product_recipe(db: AsyncSession, product: Product, recipe_in: RecipeUpdate) -> Product:
    """
    Atualiza a ficha técnica de um produto.
    Esta operação apaga a ficha técnica antiga e a substitui pela nova.
    """
    # 1. Apaga os itens da receita antiga
    await db.execute(delete(RecipeItem).where(RecipeItem.product_id == product.id))
    
    # 2. Cria os novos itens da receita
    new_recipe_items = [
        RecipeItem(
            product_id=product.id,
            ingredient_id=item.ingredient_id,
            quantity_needed=item.quantity_needed
        ) for item in recipe_in.items
    ]
    
    db.add_all(new_recipe_items)
    
    await db.commit()
    await db.refresh(product, ["recipe_items"]) # Recarrega o produto com a nova receita
    
    return product

async def get_product_with_recipe(db: AsyncSession, product_id: int) -> Product | None:
    """ Carrega um produto e sua ficha técnica (recipe_items). """
    result = await db.execute(
        select(Product)
        .where(Product.id == product_id)
        .options(selectinload(Product.recipe_items).selectinload(RecipeItem.ingredient))
    )
    return result.scalars().first()