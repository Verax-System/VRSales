from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import schemas
from app import crud
from app.db.session import SessionLocal

router = APIRouter()

# Dependência para obter a sessão do banco de dados
async def get_db():
    async with SessionLocal() as session:
        yield session

@router.post("/", response_model=schemas.Product)
async def create_product(
    product: schemas.ProductCreate, 
    db: AsyncSession = Depends(get_db)
):
    """
    Cria um novo produto.
    """
    return await crud.create_product(db=db, product=product)


@router.get("/", response_model=List[schemas.Product])
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
