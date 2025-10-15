from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta, time
from typing import Optional # Adicionar Optional

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.store import Store # Adicionamos a importação de Store que será necessária
class DashboardService:
    def _get_kpis_for_period(self, db: Session, start_date: datetime, end_date: datetime, *, store_id: Optional[int] = None) -> dict:
        """
        Método auxiliar para calcular KPIs para um período de tempo específico.
        Se store_id for fornecido, filtra por essa loja. Caso contrário, agrega de todas as lojas.
        """
        query = db.query(
            func.coalesce(func.sum(Sale.total_amount), 0).label("total_revenue"),
            func.coalesce(func.count(Sale.id), 0).label("total_sales")
        ).filter(Sale.created_at.between(start_date, end_date))

        customer_query = db.query(func.count(Customer.id)).filter(Customer.created_at.between(start_date, end_date))

        # --- INÍCIO DA ATUALIZAÇÃO ---
        if store_id:
            query = query.filter(Sale.store_id == store_id)
            customer_query = customer_query.filter(Customer.store_id == store_id)
        # --- FIM DA ATUALIZAÇÃO ---
        
        result = query.one()
        new_customers = customer_query.scalar()

        total_revenue = float(result.total_revenue)
        total_sales = int(result.total_sales)
        average_ticket = (total_revenue / total_sales) if total_sales > 0 else 0

        return {
            "total_revenue": total_revenue,
            "total_sales": total_sales,
            "average_ticket": average_ticket,
            "new_customers": new_customers
        }
    
    # ... (Os outros métodos como _get_top_products e _get_sales_by_hour podem ser refatorados da mesma forma)

    def get_dashboard_summary(self, db: Session, *, store_id: int) -> dict:
        """
        Orquestra a busca de todos os dados para o dashboard de UMA loja específica.
        """
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        today_end = datetime.combine(datetime.utcnow().date(), time.max)
        seven_days_ago = today_start - timedelta(days=7)
        thirty_days_ago = today_start - timedelta(days=30)

        summary = {
            "kpis_today": self._get_kpis_for_period(db, today_start, today_end, store_id=store_id),
            "kpis_last_7_days": self._get_kpis_for_period(db, seven_days_ago, today_end, store_id=store_id),
            # ... (outras chamadas também passariam o store_id)
        }
        return summary
    
    # --- INÍCIO DO NOVO MÉTODO ---
    def get_global_dashboard_summary(self, db: Session) -> dict:
        """
        Orquestra a busca de todos os dados para o dashboard GLOBAL, agregando todas as lojas.
        """
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        today_end = datetime.combine(datetime.utcnow().date(), time.max)
        seven_days_ago = today_start - timedelta(days=7)

        # Exemplo de dados consolidados + comparação entre lojas
        top_stores_by_revenue = (
            db.query(
                models.Store.name,
                func.sum(Sale.total_amount).label("total_revenue")
            )
            .join(Sale, models.Store.id == Sale.store_id)
            .filter(Sale.created_at.between(seven_days_ago, today_end))
            .group_by(models.Store.name)
            .order_by(func.sum(Sale.total_amount).desc())
            .limit(5)
            .all()
        )

        summary = {
            "global_kpis_today": self._get_kpis_for_period(db, today_start, today_end), # Sem store_id
            "global_kpis_last_7_days": self._get_kpis_for_period(db, seven_days_ago, today_end), # Sem store_id
            "top_5_stores_by_revenue_last_7_days": [
                {"store_name": store.name, "total_revenue": float(store.total_revenue)}
                for store in top_stores_by_revenue
            ]
        }
        return summary
    # --- FIM DO NOVO MÉTODO ---


# Instância do serviço
dashboard_service = DashboardService()