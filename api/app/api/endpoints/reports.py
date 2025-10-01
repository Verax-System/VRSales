from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List

# --- INÍCIO DA CORREÇÃO ---
from app import crud
# Importa os schemas e dependências necessários diretamente dos seus módulos
from app.schemas.report import SalesByPeriod, TopSellingProduct, SalesByUser
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---

router = APIRouter()

@router.get("/sales-by-period", response_model=SalesByPeriod)
async def report_sales_by_period(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protegido
):
    """
    Relatório de vendas consolidadas por período.
    """
    return await crud.get_sales_by_period(db, start_date=start_date, end_date=end_date)


@router.get("/top-selling-products", response_model=List[TopSellingProduct])
async def report_top_selling_products(
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protegido
):
    """
    Relatório dos produtos mais vendidos por quantidade.
    """
    return await crud.get_top_selling_products(db, limit=limit)


@router.get("/sales-by-user", response_model=List[SalesByUser])
async def report_sales_by_user(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user) # Protegido
):
    """
    Relatório de desempenho de vendas por usuário em um período.
    """
    return await crud.get_sales_by_user(db, start_date=start_date, end_date=end_date)