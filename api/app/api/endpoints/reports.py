from fastapi import APIRouter, Depends, Query, HTTPException, status
from requests import Session
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List
from app.services.analytics_service import analytics_service
from app import schemas
# --- CORREÇÃO AQUI ---
from app.services.dashboard_service import dashboard_service
from app.schemas import dashboard as dashboard_schemas
from app.api.dependencies import get_db, RoleChecker, get_current_active_user
from app.models.user import User as UserModel
from app.schemas.enums import UserRole
from app.services.analytics_service import analytics_service
from app.services.dashboard_service import dashboard_service
from app.schemas import report as report_schemas
from app.crud import crud_report
# Adicione SalesEvolutionItem ao import
from app.schemas.report import SalesByPeriod, TopSellingProduct, SalesByUser, SalesEvolutionItem
from app.schemas.user import User, UserRole
from app.api.dependencies import get_db, get_current_user, RoleChecker

router = APIRouter()

manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER])

@router.get(
    "/purchase-suggestions",
    response_model=List[schemas.report.PurchaseSuggestion],
    dependencies=[Depends(manager_permissions)],
    summary="Obter Sugestões de Compra de Estoque"
)
def get_purchase_suggestions(
    db: Session = Depends(get_db)
):
    """
    Analisa os produtos com estoque baixo e o histórico de vendas para
    gerar uma lista inteligente de sugestões de compra.

    Acessível apenas para **Admins** e **Gerentes**.
    """
    suggestions = analytics_service.get_purchase_suggestions(db)
    return suggestions

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

@router.get(
    "/dashboard",
    response_model=dashboard_schemas.DashboardSummary,
    dependencies=[Depends(manager_permissions)],
    summary="Obter Dados Consolidados para o Dashboard"
)
def get_dashboard_summary(
    *,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user) # Adiciona a dependência do utilizador
):
    """
    Recupera um resumo de dados e KPIs para o dashboard da loja do utilizador autenticado.
    """
    if not current_user.store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilizador não está associado a uma loja."
        )
    # --- CORREÇÃO PRINCIPAL ---
    # Passa o store_id do utilizador atual para o serviço
    summary_data = dashboard_service.get_dashboard_summary(db, store_id=current_user.store_id)
    return summary_data