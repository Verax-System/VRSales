from pydantic import BaseModel, Field
from typing import List
from .dashboard import DashboardKPIs # Reutilizamos o schema de KPIs

class TopStore(BaseModel):
    store_name: str
    total_revenue: float

class GlobalDashboardSummary(BaseModel):
    """Schema para o dashboard consolidado do Super Admin."""
    global_kpis_today: DashboardKPIs
    global_kpis_last_7_days: DashboardKPIs
    top_5_stores_by_revenue_last_7_days: List[TopStore]