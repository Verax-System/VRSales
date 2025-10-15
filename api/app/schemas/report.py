from pydantic import BaseModel
from datetime import date
from typing import List

class SalesByPeriod(BaseModel):
    """ Relatório de vendas totais em um período. """
    total_sales_amount: float
    number_of_transactions: int
    average_ticket: float

class TopSellingProduct(BaseModel):
    """ Relatório de um produto mais vendido. """
    product_id: int
    product_name: str
    total_quantity_sold: int
    total_revenue: float

class PurchaseSuggestion(BaseModel):
    """Schema para um item na lista de sugestões de compra."""
    product_id: int
    product_name: str
    current_stock: int
    low_stock_threshold: int
    sales_last_30_days: int
    suggested_purchase_quantity: int
    
class SalesByUser(BaseModel):
    """ Relatório de vendas consolidadas por usuário/vendedor. """
    user_id: int
    user_full_name: str
    total_sales_amount: float
    number_of_transactions: int

# --- INÍCIO DO NOVO CÓDIGO ---
class SalesEvolutionItem(BaseModel):
    """ Representa um ponto de dados no gráfico de evolução de vendas. """
    date: str
    value: float
# --- FIM DO NOVO CÓDIGO ---