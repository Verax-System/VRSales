from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.crud import crud_category
from app.schemas.category import Category, CategoryCreate, Subcategory, SubcategoryCreate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

# --- Endpoints para Categorias (Grupos) ---

@router.post("/", response_model=Category)
async def create_category(
    category_in: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova categoria de produto (Grupo)."""
    return await crud_category.create_category(db=db, category=category_in)

@router.get("/", response_model=List[Category])
async def read_categories(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todas as categorias e suas subcategorias."""
    return await crud_category.get_categories(db)

# --- Endpoints para Subcategorias (Subgrupos) ---

@router.post("/{category_id}/subcategories", response_model=Subcategory)
async def create_subcategory(
    category_id: int,
    subcategory_in: SubcategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria uma nova subcategoria dentro de uma categoria existente."""
    category = await crud_category.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return await crud_category.create_subcategory(db=db, subcategory=subcategory_in, category_id=category_id)

@router.get("/{category_id}/subcategories", response_model=List[Subcategory])
async def read_subcategories(
    category_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lista todas as subcategorias de uma categoria específica."""
    category = await crud_category.get_category(db, category_id=category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Categoria não encontrada")
    return await crud_category.get_subcategories_by_category(db, category_id=category_id)