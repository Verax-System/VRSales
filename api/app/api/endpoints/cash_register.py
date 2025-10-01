from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

# --- INÍCIO DA CORREÇÃO ---
from app import crud
# Importa os schemas e dependências necessários diretamente
from app.schemas.cash_register import CashRegisterSession, CashRegisterOpen, CashRegisterStatus
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---


router = APIRouter()

@router.post("/open", response_model=CashRegisterSession)
async def open_cash_register(
    session_in: CashRegisterOpen,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Abre uma nova sessão de caixa com um valor inicial."""
    open_session = await crud.get_open_session_by_user(db, user_id=current_user.id)
    if open_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este usuário já possui uma sessão de caixa aberta."
        )
    return await crud.open_session(db=db, session_in=session_in, user_id=current_user.id)


@router.get("/status", response_model=CashRegisterStatus)
async def get_cash_register_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna o status da sessão de caixa aberta do usuário atual."""
    session = await crud.get_open_session_by_user(db, user_id=current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma sessão de caixa aberta encontrada para este usuário."
        )

    total_sales = await crud.get_session_sales_total(db, session_id=session.id)
    expected_balance = session.opening_balance + total_sales

    # Pydantic V2 lida com a conversão de modelos ORM de forma mais inteligente.
    # Criamos um dicionário para garantir a compatibilidade e adicionar os campos extras.
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
    """Fecha a sessão de caixa aberta do usuário atual."""
    session_to_close = await crud.get_open_session_by_user(db, user_id=current_user.id)
    if not session_to_close:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhuma sessão de caixa aberta para fechar."
        )

    return await crud.close_session(db=db, db_session=session_to_close)