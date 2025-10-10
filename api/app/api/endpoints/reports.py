from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List

# --- CORREÇÃO AQUI ---
from app.crud import crud_report
# Adicione SalesEvolutionItem ao import
from app.schemas.report import SalesByPeriod, TopSellingProduct, SalesByUser, SalesEvolutionItem
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.get("/sales-by-period", response_model=SalesByPeriod)
async def report_sales_by_period(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_report.get_sales_by_period(db, start_date=start_date, end_date=end_date)


@router.get("/top-selling-products", response_model=List[TopSellingProduct])
async def report_top_selling_products(
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_report.get_top_selling_products(db, limit=limit)


@router.get("/sales-by-user", response_model=List[SalesByUser])
async def report_sales_by_user(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_report.get_sales_by_user(db, start_date=start_date, end_date=end_date)

# --- INÍCIO DO NOVO ENDPOINT ---
@router.get("/sales-evolution", response_model=List[SalesEvolutionItem])
async def report_sales_evolution(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ Retorna dados de vendas diárias para o gráfico de evolução. """
    return await crud_report.get_sales_evolution_by_period(db, start_date=start_date, end_date=end_date)
# --- FIM DO NOVO ENDPOINT ---