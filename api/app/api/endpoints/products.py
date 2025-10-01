from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import crud
from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.db.session import SessionLocal
from app.schemas.recipe import RecipeUpdate
from app import crud

# --- INÍCIO DAS NOVAS IMPORTAÇÕES ---
from app.api.dependencies import get_current_user
from app.schemas.user import User # Importa o schema do usuário para type hinting
from app.schemas.product import Product, ProductCreate, ProductUpdate
from app.schemas.user import User
from app.schemas.recipe import RecipeUpdate
from app.api.dependencies import get_db, get_current_user
# --- FIM DAS NOVAS IMPORTAÇÕES ---


router = APIRouter()

# Dependência para obter a sessão do banco de dados
async def get_db():
    async with SessionLocal() as session:
        yield session

# Endpoint público para listar produtos
@router.get("/", response_model=List[Product])
async def read_products(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna uma lista de produtos. Não requer autenticação.
    """
    products = await crud.get_products(db, skip=skip, limit=limit)
    return products

# Endpoint público para ver um produto
@router.get("/{product_id}", response_model=Product)
async def read_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna um produto específico pelo seu ID. Não requer autenticação.
    """
    db_product = await crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return db_product

# --- ENDPOINTS PROTEGIDOS ABAIXO ---

@router.post("/", response_model=Product)
async def create_product(
    product: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protegido
):
    """
    Cria um novo produto. Requer autenticação.
    """
    return await crud.create_product(db=db, product=product)


@router.put("/{product_id}", response_model=Product)
async def update_product_endpoint(
    product_id: int,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protegido
):
    """
    Atualiza um produto. Requer autenticação.
    """
    db_product = await crud.get_product(db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    updated_product = await crud.update_product(db=db, db_product=db_product, product_in=product_in)
    return updated_product


@router.delete("/{product_id}", response_model=Product)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protegido
):
    """
    Deleta um produto. Requer autenticação.
    """
    deleted_product = await crud.remove_product(db=db, product_id=product_id)
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
    """
    Atualiza a ficha técnica (receita) de um produto.
    Substitui a receita antiga pela nova enviada no corpo da requisição.
    """
    db_product = await crud.get_product(db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    updated_product = await crud.update_product_recipe(db=db, product=db_product, recipe_in=recipe_in)
    
    product_with_recipe = await crud.get_product_with_recipe(db, product_id=updated_product.id)
    
    return product_with_recipe