from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta

from app.models.product import Product
from app.models.sale import Sale, SaleItem

class AnalyticsService:
    def get_purchase_suggestions(self, db: Session) -> list[dict]:
        """
        Gera uma lista de sugestões de compra para produtos com estoque baixo.

        A lógica é a seguinte:
        1. Encontra todos os produtos cujo `stock` está abaixo do `low_stock_threshold`.
        2. Para cada um desses produtos, calcula a quantidade vendida nos últimos 30 dias.
        3. A quantidade sugerida para compra é a quantidade vendida nos últimos 30 dias,
           com um mínimo de 10 unidades para garantir um estoque de segurança.
        """
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)

        # Subquery para calcular as vendas de cada produto nos últimos 30 dias
        sales_subquery = (
            db.query(
                SaleItem.product_id,
                func.sum(SaleItem.quantity).label("sales_last_30_days")
            )
            .join(Sale)
            .filter(Sale.created_at >= thirty_days_ago)
            .group_by(SaleItem.product_id)
            .subquery()
        )

        # Query principal que junta os produtos com a subquery de vendas
        suggestions_query = (
            db.query(
                Product.id,
                Product.name,
                Product.stock,
                Product.low_stock_threshold,
                # Usa a subquery, tratando casos onde não houve vendas recentes
                func.coalesce(sales_subquery.c.sales_last_30_days, 0).label("sales_last_30_days")
            )
            .outerjoin(sales_subquery, Product.id == sales_subquery.c.product_id)
            .filter(Product.stock < Product.low_stock_threshold)
            .order_by(Product.name)
            .all()
        )

        suggestions = []
        for product in suggestions_query:
            # Lógica para a quantidade sugerida
            suggested_quantity = max(product.sales_last_30_days, 10)
            
            suggestions.append({
                "product_id": product.id,
                "product_name": product.name,
                "current_stock": product.stock,
                "low_stock_threshold": product.low_stock_threshold,
                "sales_last_30_days": product.sales_last_30_days,
                "suggested_purchase_quantity": int(suggested_quantity)
            })
            
        return suggestions

# Instância única do serviço
analytics_service = AnalyticsService()