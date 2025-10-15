from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# --- INÍCIO DA CORREÇÃO ---
# Importações explícitas e diretas para cada módulo
from app.api.dependencies import get_db, get_current_active_user
from app.models.user import User as UserModel
from app.schemas.cash_register import (
    CashRegister as CashRegisterSchema, 
    CashRegisterOpen, 
    CashRegisterClose
)
from app.services.cash_register_service import cash_register_service
# --- FIM DA CORREÇÃO ---

router = APIRouter()

@router.get(
    "/status", 
    response_model=CashRegisterSchema, # Usa o schema importado diretamente
    summary="Verificar status do caixa"
)
def get_cash_register_status(
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
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

@router.post(
    "/open", 
    response_model=CashRegisterSchema, # Usa o schema importado diretamente
    status_code=status.HTTP_201_CREATED, 
    summary="Abrir o caixa"
)
def open_cash_register(
    *,
    db: Session = Depends(get_db),
    open_info: CashRegisterOpen, # Usa o schema importado diretamente
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Abre uma nova sessão de caixa com um saldo inicial.
    """
    return cash_register_service.open_register(db=db, user=current_user, open_info=open_info)

@router.post(
    "/close", 
    response_model=CashRegisterSchema, # Usa o schema importado diretamente
    summary="Fechar o caixa"
)
def close_cash_register(
    *,
    db: Session = Depends(get_db),
    close_info: CashRegisterClose, # Usa o schema importado diretamente
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Fecha a sessão de caixa atual.

    O sistema calcula o saldo esperado com base em todas as transações.
    O usuário deve fornecer o saldo físico contado. A diferença é registrada.
    """
    return cash_register_service.close_register(db=db, close_info=close_info)