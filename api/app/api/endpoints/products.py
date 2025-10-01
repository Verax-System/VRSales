from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- INÍCIO DA CORREÇÃO ---
from app import crud
# Importa os schemas específicos do arquivo product.py
from app.schemas.product import Product, ProductCreate, ProductUpdate 
from app.db.session import SessionLocal

# --- FIM DA CORREÇÃO ---


router = APIRouter()

# Dependência para obter a sessão do banco de dados
async def get_db():
    async with SessionLocal() as session:
        yield session

# Use "Product" e "ProductCreate" diretamente
@router.post("/", response_model=Product)
async def create_product(
    product: ProductCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Cria um novo produto.
    """
    return await crud.create_product(db=db, product=product)

# Use "Product" diretamente
@router.get("/", response_model=List[Product])
async def read_products(
    skip: int = 0, 
    limit: int = 100, 
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna uma lista de produtos.
    """
    products = await crud.get_products(db, skip=skip, limit=limit)
    return products

# Use "Product" diretamente
@router.get("/{product_id}", response_model=Product)
async def read_product(
    product_id: int, 
    db: AsyncSession = Depends(get_db)
):
    """
    Retorna um produto específico pelo seu ID.
    """
    db_product = await crud.get_product(db, product_id=product_id)
    if db_product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return db_product

# Use "Product" e "ProductUpdate" diretamente
@router.put("/{product_id}", response_model=Product)
async def update_product_endpoint(
    product_id: int,
    product_in: ProductUpdate,
    db: AsyncSession = Depends(get_db)
):
    """
    Atualiza um produto.
    """
    db_product = await crud.get_product(db, product_id=product_id)
    if not db_product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    updated_product = await crud.update_product(db=db, db_product=db_product, product_in=product_in)
    return updated_product

# Use "Product" diretamente
@router.delete("/{product_id}", response_model=Product)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Deleta um produto.
    """
    deleted_product = await crud.remove_product(db=db, product_id=product_id)
    if deleted_product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return deleted_product