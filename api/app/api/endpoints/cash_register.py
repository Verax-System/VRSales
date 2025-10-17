# app/api/v1/endpoints/cash_registers.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User as UserModel
from app.schemas.cash_register import (
    CashRegister as CashRegisterSchema, 
    CashRegisterOpen, 
    CashRegisterClose
)
from app.crud.crud_cash_register import cash_register as crud_cash_register

router = APIRouter()

@router.get("/status", response_model=CashRegisterSchema)
async def get_cash_register_status(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    open_register = await crud_cash_register.get_open_register_for_store(db, store_id=current_user.store_id)
    if not open_register:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum caixa aberto encontrado."
        )
    return open_register

@router.post("/open", response_model=CashRegisterSchema, status_code=status.HTTP_201_CREATED)
async def open_cash_register(
    *,
    db: AsyncSession = Depends(get_db),
    open_info: CashRegisterOpen,
    current_user: UserModel = Depends(get_current_active_user)
):
    existing_open = await crud_cash_register.get_open_register_for_store(db, store_id=current_user.store_id)
    if existing_open:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Já existe um caixa aberto. Feche-o antes de abrir um novo."
        )
    
    return await crud_cash_register.open_register(db=db, user=current_user, open_info=open_info)

@router.post("/close", response_model=CashRegisterSchema)
async def close_cash_register(
    *,
    db: AsyncSession = Depends(get_db),
    close_info: CashRegisterClose,
    current_user: UserModel = Depends(get_current_active_user)
):
    # Lógica de fechamento pode ser adicionada aqui no futuro
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Funcionalidade de fechar caixa não implementada.")