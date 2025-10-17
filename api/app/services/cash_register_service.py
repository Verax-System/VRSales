# api/app/services/cash_register_service.py

from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from loguru import logger
from datetime import datetime

from app.models.cash_register import CashRegister, CashRegisterTransaction, TransactionType, CashRegisterStatus
from app.crud import crud_cash_register
from app.models.user import User
from app.models.sale import Sale
from app.schemas.cash_register import CashRegisterOpen, CashRegisterClose

class CashRegisterService:
    
    def get_open_register(self, db: Session, *, store_id: int) -> CashRegister:
        """Busca o caixa aberto para uma loja específica. Levanta uma exceção se não encontrar."""
        open_register = db.query(CashRegister).filter(
            CashRegister.store_id == store_id,
            CashRegister.status == CashRegisterStatus.OPEN
        ).first()
        
        if not open_register:
            logger.warning(f"Tentativa de operação em caixa, mas nenhum caixa aberto foi encontrado para a loja ID {store_id}.")
            # --- CORREÇÃO: MENSAGEM DE ERRO MAIS DETALHADA ---
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Operação falhou: Nenhum caixa aberto encontrado para a loja ID {store_id}.",
            )
        return open_register

    def open_register(self, db: Session, *, user: User, open_info: CashRegisterOpen) -> CashRegister:
        """Cria um novo registro de caixa e sua transação de abertura inicial."""
        cash_register_obj = CashRegister(
            user_id=user.id,
            store_id=user.store_id,
            opening_balance=open_info.opening_balance,
            status=CashRegisterStatus.OPEN
        )
        db.add(cash_register_obj)
        db.flush()
        
        opening_transaction = CashRegisterTransaction(
            cash_register_id=cash_register_obj.id,
            transaction_type=TransactionType.SUPPLY,
            amount=open_info.opening_balance,
            description="Saldo de abertura do caixa"
        )
        db.add(opening_transaction)
        
        db.commit()
        db.refresh(cash_register_obj)
        
        return cash_register_obj

    def add_sale_transaction(self, db: Session, *, sale: Sale) -> None:
        """
        Registra os pagamentos de uma venda como transações no caixa aberto.
        """
        open_register = self.get_open_register(db, store_id=sale.store_id)

        for payment in sale.payments:
            transaction = CashRegisterTransaction(
                cash_register_id=open_register.id,
                sale_id=sale.id,
                transaction_type=TransactionType.SALE_PAYMENT,
                amount=payment.amount,
                description=f"Pagamento da Venda #{sale.id} via {payment.payment_method}"
            )
            db.add(transaction)
        
        db.flush()
        logger.info(f"Transações de pagamento para a Venda ID {sale.id} adicionadas ao Caixa ID {open_register.id}.")

    def close_register(self, db: Session, *, user: User, close_info: CashRegisterClose) -> CashRegister:
        """
        Fecha o caixa aberto, calculando o saldo esperado e a diferença.
        """
        open_register = self.get_open_register(db, store_id=user.store_id)

        total_transactions = (
            db.query(func.sum(CashRegisterTransaction.amount))
            .filter(CashRegisterTransaction.cash_register_id == open_register.id)
            .scalar()
        ) or 0.0

        expected_balance = total_transactions

        open_register.closing_balance = close_info.closing_balance
        open_register.expected_balance = expected_balance
        open_register.balance_difference = close_info.closing_balance - expected_balance
        open_register.status = CashRegisterStatus.CLOSED
        open_register.closed_at = datetime.utcnow()
        
        db.add(open_register)
        
        closing_transaction = CashRegisterTransaction(
            cash_register_id=open_register.id,
            transaction_type=TransactionType.CLOSING_BALANCE,
            amount=close_info.closing_balance,
            description=f"Fechamento do caixa. Esperado: {expected_balance:.2f}, Diferença: {open_register.balance_difference:.2f}"
        )
        db.add(closing_transaction)
        
        db.commit()
        db.refresh(open_register)
        
        logger.info(f"Caixa ID {open_register.id} fechado. Esperado: {expected_balance:.2f}, Fechado com: {close_info.closing_balance:.2f}, Diferença: {open_register.balance_difference:.2f}")

        return open_register

cash_register_service = CashRegisterService()