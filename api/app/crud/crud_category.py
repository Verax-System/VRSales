from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.models.category import ProductCategory, ProductSubcategory
from app.schemas.category import ProductCategoryCreate, ProductSubcategoryCreate

# --- Funções para Categorias (Grupos) ---

async def create_category(db: AsyncSession, category: ProductCategoryCreate) -> ProductCategory:
    db_category = ProductCategory(name=category.name)
    db.add(db_category)
    await db.commit()
    await db.refresh(db_category)
    return db_category

async def get_category(db: AsyncSession, category_id: int) -> Optional[ProductCategory]:
    result = await db.execute(
        select(ProductCategory).where(ProductCategory.id == category_id).options(selectinload(ProductCategory.subcategories))
    )
    return result.scalars().first()

async def get_categories(db: AsyncSession) -> List[ProductCategory]:
    result = await db.execute(select(ProductCategory).options(selectinload(ProductCategory.subcategories)))
    return result.scalars().all()

# --- Funções para Subcategorias (Subgrupos) ---

async def create_subcategory(db: AsyncSession, subcategory: ProductCategoryCreate, category_id: int) -> ProductSubcategory:
    db_subcategory = ProductSubcategory(name=subcategory.name, category_id=category_id)
    db.add(db_subcategory)
    await db.commit()
    await db.refresh(db_subcategory)
    return db_subcategory

async def get_subcategories_by_category(db: AsyncSession, category_id: int) -> List[ProductSubcategory]:
    result = await db.execute(select(ProductSubcategory).where(ProductSubcategory.category_id == category_id))
    return result.scalars().all()