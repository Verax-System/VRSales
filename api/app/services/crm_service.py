from sqlalchemy.orm import Session
from datetime import datetime

from app.models.customer import Customer
from app.models.sale import Sale
from app.crud import customer as crud_customer

class CRMService:
    def update_customer_stats_from_sale(self, db: Session, *, sale: Sale) -> None:
        """
        Atualiza as estatísticas de CRM de um cliente com base em uma nova venda.

        Esta função é chamada após a criação de uma venda. Ela:
        1. Verifica se a venda está associada a um cliente.
        2. Atualiza o 'total_spent' (valor total gasto).
        3. Adiciona pontos de fidelidade (ex: 1 ponto para cada R$10,00 gastos).
        4. Atualiza a data da última visita ('last_seen').
        """
        if not sale.customer_id:
            # Se a venda não tem cliente, não há o que fazer.
            return

        customer = crud_customer.customer.get(db, id=sale.customer_id)
        if not customer:
            # Caso o cliente associado não seja encontrado (improvável)
            return

        # 1. Atualiza o valor total gasto
        customer.total_spent += sale.total_amount

        # 2. Calcula e adiciona pontos de fidelidade
        # Regra de negócio: 1 ponto a cada R$ 10,00 gastos.
        loyalty_points_earned = int(sale.total_amount // 10)
        customer.loyalty_points += loyalty_points_earned
        
        # 3. Atualiza a data da última visita/compra
        customer.last_seen = datetime.utcnow()

        # Salva as alterações no banco de dados
        db.add(customer)
        db.commit()
        db.refresh(customer)

# Instância única do serviço para ser usada na aplicação
crm_service = CRMService()