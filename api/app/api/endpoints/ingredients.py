from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- INÍCIO DA CORREÇÃO ---
from app import crud
# Importa os schemas e dependências necessários diretamente
from app.schemas.ingredient import Ingredient, IngredientCreate, IngredientStockUpdate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---

router = APIRouter()

# CRUD básico para Insumos
@router.post("/", response_model=Ingredient)
async def create_ingredient(
    ingredient_in: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.create_ingredient(db=db, ingredient=ingredient_in)

@router.get("/", response_model=List[Ingredient])
async def read_ingredients(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.get_ingredients(db)

# Endpoint para entrada/saída de estoque
@router.post("/{ingredient_id}/update_stock", response_model=Ingredient)
async def update_ingredient_stock(
    ingredient_id: int,
    stock_update: IngredientStockUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Adiciona ou remove estoque de um insumo.
    Use uma quantidade positiva para adicionar e negativa para remover.
    """
    db_ingredient = await crud.get_ingredient(db, ingredient_id=ingredient_id)
    if not db_ingredient:
        raise HTTPException(status_code=404, detail="Insumo não encontrado")
    
    db_ingredient.stock += stock_update.quantity
    await db.commit()
    await db.refresh(db_ingredient)
    return db_ingredient