from sqlalchemy.orm import Session
from datetime import datetime

from app.models.customer import Customer
from app.models.sale import Sale
# A importação do crud não é mais necessária aqui, vamos usar a sessão do DB diretamente

class CRMService:
    def update_customer_stats_from_sale(self, db: Session, *, sale: Sale) -> None:
        """
        Atualiza as estatísticas de CRM de um cliente com base em uma nova venda.
        """
        if not sale.customer_id:
            return

        # --- CORREÇÃO PRINCIPAL AQUI ---
        # Usamos o método síncrono padrão do SQLAlchemy para buscar um objeto pela sua chave primária.
        # Isso é mais direto e evita o erro de chamada.
        customer = db.get(Customer, sale.customer_id)
        # --- FIM DA CORREÇÃO ---
        
        if not customer:
            # Caso o cliente associado não seja encontrado (improvável)
            return

        # 1. Atualiza o valor total gasto
        # Garante que o valor não seja None antes de somar
        customer.total_spent = (customer.total_spent or 0) + sale.total_amount

        # 2. Calcula e adiciona pontos de fidelidade
        loyalty_points_earned = int(sale.total_amount // 10)
        customer.loyalty_points = (customer.loyalty_points or 0) + loyalty_points_earned
        
        # 3. Atualiza a data da última visita/compra
        customer.last_seen = datetime.utcnow()

        # Adiciona o objeto modificado à sessão. O commit será feito pelo chamador.
        db.add(customer)

# Instância única do serviço para ser usada na aplicação
crm_service = CRMService()