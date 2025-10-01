from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from app.models.ingredient import Ingredient
from app.schemas.ingredient import IngredientCreate, IngredientUpdate

async def get_ingredient(db: AsyncSession, ingredient_id: int) -> Optional[Ingredient]:
    return await db.get(Ingredient, ingredient_id)

async def get_ingredients(db: AsyncSession, skip: int = 0, limit: int = 100) -> List[Ingredient]:
    result = await db.execute(select(Ingredient).offset(skip).limit(limit))
    return result.scalars().all()

async def create_ingredient(db: AsyncSession, ingredient: IngredientCreate) -> Ingredient:
    db_ingredient = Ingredient(**ingredient.model_dump())
    db.add(db_ingredient)
    await db.commit()
    await db.refresh(db_ingredient)
    return db_ingredient

async def update_ingredient(db: AsyncSession, db_ingredient: Ingredient, ingredient_in: IngredientUpdate) -> Ingredient:
    update_data = ingredient_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_ingredient, key, value)
    await db.commit()
    await db.refresh(db_ingredient)
    return db_ingredient

async def remove_ingredient(db: AsyncSession, ingredient_id: int) -> Optional[Ingredient]:
    db_ingredient = await get_ingredient(db, ingredient_id)
    if db_ingredient:
        await db.delete(db_ingredient)
        await db.commit()
    return db_ingredient