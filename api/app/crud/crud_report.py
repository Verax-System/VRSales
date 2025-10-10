from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from datetime import date, timedelta # Adicione timedelta

from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.user import User

# ... (funções existentes get_sales_by_period, get_top_selling_products, get_sales_by_user) ...

async def get_sales_by_period(db: AsyncSession, start_date: date, end_date: date):
    """
    Calcula o total de vendas, número de transações e ticket médio
    dentro de um período de datas.
    """
    result = await db.execute(
        select(
            func.sum(Sale.total_amount).label("total_sales"),
            func.count(Sale.id).label("num_transactions")
        ).where(
            func.date(Sale.created_at) >= start_date,
            func.date(Sale.created_at) <= end_date
        )
    )
    data = result.first()
    
    total_sales = data.total_sales or 0.0
    num_transactions = data.num_transactions or 0
    
    average_ticket = (total_sales / num_transactions) if num_transactions > 0 else 0.0
    
    return {
        "total_sales_amount": total_sales,
        "number_of_transactions": num_transactions,
        "average_ticket": average_ticket
    }


async def get_top_selling_products(db: AsyncSession, limit: int = 5):
    """
    Retorna uma lista dos produtos mais vendidos por quantidade.
    """
    result = await db.execute(
        select(
            SaleItem.product_id,
            Product.name.label("product_name"),
            func.sum(SaleItem.quantity).label("total_quantity"),
            func.sum(SaleItem.quantity * SaleItem.price_at_sale).label("total_revenue")
        )
        .join(Product, SaleItem.product_id == Product.id)
        .group_by(SaleItem.product_id, Product.name)
        .order_by(desc("total_quantity"))
        .limit(limit)
    )
    return result.mappings().all()

async def get_sales_by_user(db: AsyncSession, start_date: date, end_date: date):
    """
    Agrupa o total de vendas e transações por usuário em um período.
    """
    result = await db.execute(
        select(
            Sale.user_id,
            User.full_name.label("user_full_name"),
            func.sum(Sale.total_amount).label("total_sales_amount"),
            func.count(Sale.id).label("number_of_transactions")
        )
        .join(User, Sale.user_id == User.id)
        .where(
            func.date(Sale.created_at) >= start_date,
            func.date(Sale.created_at) <= end_date
        )
        .group_by(Sale.user_id, User.full_name)
        .order_by(desc("total_sales_amount"))
    )
    return result.mappings().all()

# --- INÍCIO DO NOVO CÓDIGO ---
async def get_sales_evolution_by_period(db: AsyncSession, start_date: date, end_date: date):
    """
    Retorna o total de vendas agrupado por dia para um gráfico de evolução.
    """
    result = await db.execute(
        select(
            func.date(Sale.created_at).label("date"),
            func.sum(Sale.total_amount).label("value")
        ).where(
            func.date(Sale.created_at) >= start_date,
            func.date(Sale.created_at) <= end_date
        )
        .group_by(func.date(Sale.created_at))
        .order_by(func.date(Sale.created_at))
    )
    
    # Preenche os dias sem vendas com valor 0
    sales_data = {item.date: item.value for item in result.mappings().all()}
    all_dates = []
    current_date = start_date
    while current_date <= end_date:
        all_dates.append({
            "date": current_date.strftime("%d/%m"),
            "value": sales_data.get(current_date, 0.0)
        })
        current_date += timedelta(days=1)
        
    return all_dates
# --- FIM DO NOVO CÓDIGO ---