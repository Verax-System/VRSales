from pydantic import BaseModel, Field
from typing import List, Optional

class DashboardKPIs(BaseModel):
    """Schema para os principais indicadores de desempenho (KPIs)."""
    total_revenue: float = Field(..., description="Receita total no período.")
    total_sales: int = Field(..., description="Número total de vendas no período.")
    average_ticket: float = Field(..., description="Valor médio por venda (ticket médio).")
    new_customers: int = Field(..., description="Número de novos clientes registrados no período.")

class TopSellingProduct(BaseModel):
    """Schema para um produto na lista dos mais vendidos."""
    product_id: int
    product_name: str
    total_quantity_sold: int
    total_revenue_generated: float

class SalesByHour(BaseModel):
    """Schema para o volume de vendas por hora do dia."""
    hour: int
    total_sales: int

class DashboardSummary(BaseModel):
    """Schema principal que agrega todos os dados do dashboard."""
    kpis_today: DashboardKPIs
    kpis_last_7_days: DashboardKPIs
    top_5_products_by_revenue_last_30_days: List[TopSellingProduct]
    top_5_products_by_quantity_last_30_days: List[TopSellingProduct]
    sales_by_hour_today: List[SalesByHour]