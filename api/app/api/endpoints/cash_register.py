from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

# --- CORREÇÃO AQUI ---
from app.crud import crud_cash_register
from app.schemas.cash_register import CashRegisterSession, CashRegisterOpen, CashRegisterStatus
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.post("/open", response_model=CashRegisterSession)
async def open_cash_register(
    session_in: CashRegisterOpen,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    open_session = await crud_cash_register.get_open_session_by_user(db, user_id=current_user.id)
    if open_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuário já possui uma sessão de caixa aberta."
        )
    return await crud_cash_register.open_session(db=db, session_in=session_in, user_id=current_user.id)


@router.get("/status", response_model=CashRegisterStatus)
async def get_cash_register_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = await crud_cash_register.get_open_session_by_user(db, user_id=current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma sessão de caixa aberta encontrada para este usuário."
        )

    total_sales = await crud_cash_register.get_session_sales_total(db, session_id=session.id)
    expected_balance = session.opening_balance + total_sales

    status_data = {
        "id": session.id,
        "user_id": session.user_id,
        "opening_balance": session.opening_balance,
        "closing_balance": session.closing_balance,
        "opened_at": session.opened_at,
        "closed_at": session.closed_at,
        "is_open": session.is_open,
        "total_sales": total_sales,
        "expected_balance": expected_balance,
    }
    return status_data


@router.post("/close", response_model=CashRegisterSession)
async def close_cash_register(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session_to_close = await crud_cash_register.get_open_session_by_user(db, user_id=current_user.id)
    if not session_to_close:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma sessão de caixa aberta para fechar."
        )

    return await crud_cash_register.close_session(db=db, db_session=session_to_close)