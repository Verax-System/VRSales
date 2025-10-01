from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- INÍCIO DA CORREÇÃO ---
# Importa o módulo CRUD específico para produtos
from app.crud import crud_product, crud_recipe
# Importa todos os schemas necessários diretamente
from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.schemas.user import User
from app.schemas.recipe import RecipeUpdate
from app.api.dependencies import get_db, get_current_user
from app.db.session import SessionLocal # Adicionado para a dependência get_db
# --- FIM DA CORREÇÃO ---


router = APIRouter()

# A dependência get_db estava faltando a importação de SessionLocal
async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/", response_model=Product)
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_product.create_product(db=db, product=product)

@router.get("/", response_model=List[Product])
async def read_products(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    # A chamada agora usa crud_product
    return await crud_product.get_products(db, skip=skip, limit=limit)

@router.get("/{product_id}", response_model=Product)
async def read_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    db_product = await crud_product.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return db_product

@router.put("/{product_id}", response_model=Product)
async def update_product_endpoint(
    product_id: int,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = await crud_product.get_product(db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return await crud_product.update_product(db=db, db_product=db_product, product_in=product_in)

@router.delete("/{product_id}", response_model=Product)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    deleted_product = await crud_product.remove_product(db=db, product_id=product_id)
    if deleted_product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return deleted_product


@router.put("/{product_id}/recipe", response_model=Product)
async def update_product_recipe_endpoint(
    product_id: int,
    recipe_in: RecipeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_product = await crud_product.get_product(db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    updated_product = await crud_recipe.update_product_recipe(db=db, product=db_product, recipe_in=recipe_in)
    
    product_with_recipe = await crud_recipe.get_product_with_recipe(db, product_id=updated_product.id)
    
    return product_with_recipe

@router.get("/lookup/", response_model=List[Product])
async def lookup_products_endpoint(
    query: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Endpoint de busca rápida para a tela de PDV.
    Busca por nome ou código de barras.
    """
    return await crud_product.lookup_product(db=db, query=query)

# --- FIM DO NOVO ENDPOINT ---