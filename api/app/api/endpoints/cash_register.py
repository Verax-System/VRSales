from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_active_user
from app.models import User
from app import schemas
from app.services.cash_register_service import cash_register_service

router = APIRouter()

@router.get("/status", response_model=schemas.CashRegister, summary="Verificar status do caixa")
def get_cash_register_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Verifica se há um caixa aberto no momento. Se sim, retorna seus detalhes.
    Se não houver, retorna um erro 404.
    """
    open_register = cash_register_service.get_open_register(db)
    if not open_register:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nenhum caixa aberto encontrado."
        )
    return open_register




@router.post("/open", response_model=schemas.CashRegister, status_code=status.HTTP_201_CREATED, summary="Abrir o caixa")
def open_cash_register(
    *,
    db: Session = Depends(get_db),
    open_info: schemas.CashRegisterOpen,
    current_user: User = Depends(get_current_active_user)
):
    """
    Abre uma nova sessão de caixa com um saldo inicial.
    """
    return cash_register_service.open_register(db=db, user=current_user, open_info=open_info)

@router.post("/close", response_model=schemas.CashRegister, summary="Fechar o caixa")
def close_cash_register(
    *,
    db: Session = Depends(get_db),
    close_info: schemas.CashRegisterClose,
    current_user: User = Depends(get_current_active_user)
):
    """
    Fecha a sessão de caixa atual.

    O sistema calcula o saldo esperado com base em todas as transações.
    O usuário deve fornecer o saldo físico contado. A diferença é registrada.
    """
    return cash_register_service.close_register(db=db, close_info=close_info)
# --- FIM DO NOVO ENDPOINT ---