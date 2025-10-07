from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- CORREÇÃO AQUI ---
from app.crud import crud_customer
from app.schemas.customer import Customer, CustomerCreate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user


router = APIRouter()

@router.post("/", response_model=Customer)
async def create_customer(
    customer_in: CustomerCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_customer.create_customer(db=db, customer=customer_in)


@router.get("/", response_model=List[Customer])
async def read_customers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_customer.get_customers(db, skip=skip, limit=limit)


@router.get("/{customer_id}", response_model=Customer)
async def read_customer(
    customer_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_customer = await crud_customer.get_customer(db, customer_id=customer_id)
    if db_customer is None:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return db_customer