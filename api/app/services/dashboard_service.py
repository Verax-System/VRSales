from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta, time
from typing import Optional, List

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.store import Store


class DashboardService:
    def _get_kpis_for_period(self, db: Session, start_date: datetime, end_date: datetime, *, store_id: Optional[int] = None) -> dict:
        query = db.query(
            func.coalesce(func.sum(Sale.total_amount), 0).label("total_revenue"),
            func.coalesce(func.count(Sale.id), 0).label("total_sales")
        ).filter(Sale.created_at.between(start_date, end_date))

        customer_query = db.query(func.count(Customer.id)).filter(Customer.created_at.between(start_date, end_date))

        if store_id:
            query = query.filter(Sale.store_id == store_id)
            customer_query = customer_query.filter(Customer.store_id == store_id)
        
        result = query.one()
        new_customers = customer_query.scalar() or 0

        total_revenue = float(result.total_revenue)
        total_sales = int(result.total_sales)
        average_ticket = (total_revenue / total_sales) if total_sales > 0 else 0

        # Devolve um dicionário Python puro
        return {
            "total_revenue": total_revenue,
            "total_sales": total_sales,
            "average_ticket": average_ticket,
            "new_customers": new_customers
        }
    
    def _get_top_products(self, db: Session, start_date: datetime, end_date: datetime, order_by: str = 'revenue') -> List[dict]:
        query = (
            db.query(
                Product.id.label("product_id"),
                Product.name.label("product_name"),
                func.sum(SaleItem.quantity).label("total_quantity_sold"),
                func.sum(SaleItem.quantity * SaleItem.price_at_sale).label("total_revenue_generated")
            )
            .join(SaleItem, Product.id == SaleItem.product_id)
            .join(Sale, SaleItem.sale_id == Sale.id)
            .filter(Sale.created_at.between(start_date, end_date))
            .group_by(Product.id, Product.name)
        )
        
        if order_by == 'revenue':
            query = query.order_by(func.sum(SaleItem.quantity * SaleItem.price_at_sale).desc())
        else:
            query = query.order_by(func.sum(SaleItem.quantity).desc())

        results = query.limit(5).all()
        # --- INÍCIO DA CORREÇÃO ---
        # Converte a lista de objetos Row em uma lista de dicionários puros
        return [dict(row._mapping) for row in results]
        # --- FIM DA CORREÇÃO ---
        
    def _get_sales_by_hour(self, db: Session, start_date: datetime, end_date: datetime) -> List[dict]:
        sales_data = (
            db.query(
                extract('hour', Sale.created_at).label('hour'),
                func.count(Sale.id).label('total_sales')
            )
            .filter(Sale.created_at.between(start_date, end_date))
            .group_by('hour')
            .order_by('hour')
            .all()
        )
        sales_by_hour_map = {item.hour: item.total_sales for item in sales_data}
        return [{"hour": h, "total_sales": sales_by_hour_map.get(h, 0)} for h in range(24)]

    def get_dashboard_summary(self, db: Session, *, store_id: int) -> dict:
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        today_end = datetime.combine(datetime.utcnow().date(), time.max)
        thirty_days_ago = today_start - timedelta(days=30)
        
        return {
            "kpis_today": self._get_kpis_for_period(db, today_start, today_end, store_id=store_id),
            "kpis_last_7_days": self._get_kpis_for_period(db, today_start - timedelta(days=7), today_end, store_id=store_id),
            "top_5_products_by_revenue_last_30_days": self._get_top_products(db, thirty_days_ago, today_end, 'revenue'),
            "top_5_products_by_quantity_last_30_days": self._get_top_products(db, thirty_days_ago, today_end, 'quantity'),
            "sales_by_hour_today": self._get_sales_by_hour(db, today_start, today_end),
        }

    def get_global_dashboard_summary(self, db: Session) -> dict:
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        today_end = datetime.combine(datetime.utcnow().date(), time.max)
        seven_days_ago = today_start - timedelta(days=7)

        top_stores_by_revenue = (
            db.query(
                Store.name.label("store_name"),
                func.sum(Sale.total_amount).label("total_revenue")
            )
            .join(Sale, Store.id == Sale.store_id)
            .filter(Sale.created_at.between(seven_days_ago, today_end))
            .group_by(Store.name)
            .order_by(func.sum(Sale.total_amount).desc())
            .limit(5)
            .all()
        )

        return {
            "global_kpis_today": self._get_kpis_for_period(db, today_start, today_end),
            "global_kpis_last_7_days": self._get_kpis_for_period(db, seven_days_ago, today_end),
            "top_5_stores_by_revenue_last_7_days": [dict(row._mapping) for row in top_stores_by_revenue] # Converte para dicionário
        }

# Instância do serviço
dashboard_service = DashboardService()