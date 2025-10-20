# api/app/services/dashboard_service.py
from sqlalchemy.ext.asyncio import AsyncSession # Usar AsyncSession
from sqlalchemy.future import select # Usar select assíncrono
from sqlalchemy import func, extract
from datetime import datetime, timedelta, time
from typing import Optional, List, Dict, Any 

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.customer import Customer
from app.models.store import Store
from app.schemas.dashboard import DashboardKPIs # Importar schema para tipagem

class DashboardService:

    async def _get_kpis_for_period(self, db: AsyncSession, start_date: datetime, end_date: datetime, *, store_id: Optional[int] = None) -> Dict[str, Any]: # Usar Dict ou DashboardKPIs
        """ Calcula KPIs para um período de forma assíncrona. """
        stmt = select(
            func.coalesce(func.sum(Sale.total_amount), 0.0).label("total_revenue"),
            func.coalesce(func.count(Sale.id), 0).label("total_sales")
        ).filter(Sale.created_at.between(start_date, end_date))

        customer_stmt = select(func.count(Customer.id)).filter(Customer.created_at.between(start_date, end_date))

        if store_id:
            stmt = stmt.filter(Sale.store_id == store_id)
            customer_stmt = customer_stmt.filter(Customer.store_id == store_id)

        result_kpi = await db.execute(stmt)
        kpi_data = result_kpi.one() # Usar .one() se esperar exatamente uma linha

        result_customer = await db.execute(customer_stmt)
        new_customers = result_customer.scalar() or 0

        total_revenue = float(kpi_data.total_revenue)
        total_sales = int(kpi_data.total_sales)
        average_ticket = (total_revenue / total_sales) if total_sales > 0 else 0.0

        return {
            "total_revenue": total_revenue,
            "total_sales": total_sales,
            "average_ticket": average_ticket,
            "new_customers": new_customers
        }

    async def _get_top_products(self, db: AsyncSession, start_date: datetime, end_date: datetime, order_by: str = 'revenue', *, store_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """ Busca top produtos de forma assíncrona. """
        stmt = (
            select(
                Product.id.label("product_id"),
                Product.name.label("product_name"),
                func.sum(SaleItem.quantity).label("total_quantity_sold"),
                func.sum(SaleItem.quantity * SaleItem.price_at_sale).label("total_revenue_generated")
            )
            .join(SaleItem, Product.id == SaleItem.product_id)
            .join(Sale, SaleItem.sale_id == Sale.id) # Junta com Sale para filtrar por data e loja
            .filter(Sale.created_at.between(start_date, end_date))
        )

        if store_id:
            stmt = stmt.filter(Sale.store_id == store_id) # Filtrar por loja

        stmt = stmt.group_by(Product.id, Product.name) # Agrupar após filtros

        if order_by == 'revenue':
            stmt = stmt.order_by(func.sum(SaleItem.quantity * SaleItem.price_at_sale).desc())
        else: # order_by 'quantity'
            stmt = stmt.order_by(func.sum(SaleItem.quantity).desc())

        stmt = stmt.limit(5)

        result = await db.execute(stmt)
        # Usar mappings().all() para obter lista de dicionários
        return [dict(row) for row in result.mappings().all()]


    async def _get_sales_by_hour(self, db: AsyncSession, start_date: datetime, end_date: datetime, *, store_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """ Busca vendas por hora de forma assíncrona. """
        stmt = (
            select(
                extract('hour', Sale.created_at).label('hour'),
                func.count(Sale.id).label('total_sales')
            )
            .filter(Sale.created_at.between(start_date, end_date))
        )

        if store_id:
            stmt = stmt.filter(Sale.store_id == store_id) # Filtrar por loja

        stmt = stmt.group_by('hour').order_by('hour') # Agrupar e ordenar após filtro

        result = await db.execute(stmt)
        sales_data = result.mappings().all() # Obter todos os resultados como dicionários

        sales_by_hour_map = {item['hour']: item['total_sales'] for item in sales_data}
        # Retorna a lista completa com 0 para horas sem vendas
        return [{"hour": h, "total_sales": sales_by_hour_map.get(h, 0)} for h in range(24)]

    async def get_dashboard_summary(self, db: AsyncSession, *, store_id: int) -> Dict[str, Any]:
        """ Agrega todos os dados do dashboard de forma assíncrona. """
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        today_end = datetime.combine(datetime.utcnow().date(), time.max)
        seven_days_ago = today_start - timedelta(days=7) # Corrigido cálculo
        thirty_days_ago = today_start - timedelta(days=30)

        # Chama as funções auxiliares assíncronas com await
        kpis_today = await self._get_kpis_for_period(db, today_start, today_end, store_id=store_id)
        kpis_last_7_days = await self._get_kpis_for_period(db, seven_days_ago, today_end, store_id=store_id)
        top_revenue = await self._get_top_products(db, thirty_days_ago, today_end, 'revenue', store_id=store_id)
        top_quantity = await self._get_top_products(db, thirty_days_ago, today_end, 'quantity', store_id=store_id)
        sales_hour = await self._get_sales_by_hour(db, today_start, today_end, store_id=store_id)

        return {
            "kpis_today": kpis_today,
            "kpis_last_7_days": kpis_last_7_days,
            "top_5_products_by_revenue_last_30_days": top_revenue,
            "top_5_products_by_quantity_last_30_days": top_quantity,
            "sales_by_hour_today": sales_hour,
        }

    async def get_global_dashboard_summary(self, db: AsyncSession) -> Dict[str, Any]:
        """ Agrega dados do dashboard global de forma assíncrona. """
        today_start = datetime.combine(datetime.utcnow().date(), time.min)
        today_end = datetime.combine(datetime.utcnow().date(), time.max)
        seven_days_ago = today_start - timedelta(days=7)

        # Query para top lojas (assíncrona)
        top_stores_stmt = (
            select(
                Store.name.label("store_name"),
                func.sum(Sale.total_amount).label("total_revenue")
            )
            .join(Sale, Store.id == Sale.store_id)
            .filter(Sale.created_at.between(seven_days_ago, today_end))
            .group_by(Store.name)
            .order_by(func.sum(Sale.total_amount).desc())
            .limit(5)
        )

        # Executa as chamadas assíncronas em paralelo (melhora performance)
        results = await asyncio.gather(
             self._get_kpis_for_period(db, today_start, today_end), # store_id=None
             self._get_kpis_for_period(db, seven_days_ago, today_end), # store_id=None
             db.execute(top_stores_stmt)
        )

        kpis_today_global = results[0]
        kpis_7_days_global = results[1]
        top_stores_result = results[2]

        return {
            "global_kpis_today": kpis_today_global,
            "global_kpis_last_7_days": kpis_7_days_global,
            "top_5_stores_by_revenue_last_7_days": [dict(row) for row in top_stores_result.mappings().all()]
        }

# Precisa importar asyncio para usar asyncio.gather
import asyncio

# Instância do serviço
dashboard_service = DashboardService()