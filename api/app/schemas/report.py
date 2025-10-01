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

class SalesByUser(BaseModel):
    """ Relatório de vendas consolidadas por usuário/vendedor. """
    user_id: int
    user_full_name: str
    total_sales_amount: float
    number_of_transactions: int