from sqlalchemy.orm import Session
from sqlalchemy import func # Adicionar func para usar a função sum do SQL
from fastapi import HTTPException, status
from loguru import logger
from datetime import datetime # Adicionar datetime

from app.models.cash_register import CashRegister, CashRegisterTransaction
from app.models.cash_register import CashRegisterStatus, TransactionType
from app.crud import crud_cash_register
from app.models.user import User
from app.models.sale import Sale
from app.schemas.cash_register import CashRegisterOpen, CashRegisterClose # Adicionar CashRegisterClose

class CashRegisterService:
    # ... (métodos existentes: get_open_register, open_register, add_sale_transaction)

    # --- INÍCIO DO NOVO MÉTODO ---
    def close_register(self, db: Session, *, close_info: CashRegisterClose) -> CashRegister:
        """
        Fecha o caixa aberto, calculando o saldo esperado e a diferença.
        """
        open_register = self.get_open_register(db)
        if not open_register:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Nenhum caixa aberto para fechar.",
            )

        # 1. Calcula o total de todas as transações (positivas e negativas)
        total_transactions = (
            db.query(func.sum(CashRegisterTransaction.amount))
            .filter(CashRegisterTransaction.cash_register_id == open_register.id)
            .scalar()
        ) or 0.0

        # 2. Calcula o saldo esperado
        # O saldo de abertura já está incluído no total_transactions
        expected_balance = total_transactions

        # 3. Atualiza o registro do caixa com os valores de fechamento
        open_register.closing_balance = close_info.closing_balance
        open_register.expected_balance = expected_balance
        open_register.balance_difference = close_info.closing_balance - expected_balance
        open_register.status = CashRegisterStatus.CLOSED
        open_register.closed_at = datetime.utcnow()
        
        db.add(open_register)
        
        # 4. (Opcional, mas recomendado) Cria uma transação final de fechamento para o histórico
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
    # --- FIM DO NOVO MÉTODO ---

# Instância do serviço
cash_register_service = CashRegisterService()