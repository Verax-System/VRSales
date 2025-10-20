# api/app/api/endpoints/reports.py
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession # Usar AsyncSession
from datetime import date
from typing import List, Any # Adicionado Any para tipagem de retorno

# Importações reorganizadas e corrigidas
from app.services.analytics_service import analytics_service
from app.schemas import report as report_schemas, dashboard as dashboard_schemas
from app.api.dependencies import get_db, RoleChecker, get_current_active_user, get_current_user # Adicionado get_current_user
from app.models.user import User as UserModel
from app.schemas.enums import UserRole
from app.services.dashboard_service import dashboard_service # Serviço do Dashboard
from app.crud import crud_report
from app.schemas.report import SalesByPeriod, TopSellingProduct, SalesByUser, SalesEvolutionItem, PurchaseSuggestion # Importar todos os schemas
from app.schemas.user import User # Schema do usuário


router = APIRouter()

manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER])

@router.get(
    "/purchase-suggestions",
    response_model=List[PurchaseSuggestion],
    dependencies=[Depends(manager_permissions)],
    summary="Obter Sugestões de Compra de Estoque"
)
async def get_purchase_suggestions( # Alterado para async
    db: AsyncSession = Depends(get_db) # Alterado para AsyncSession
):
    """
    Analisa os produtos com estoque baixo e o histórico de vendas para
    gerar uma lista inteligente de sugestões de compra.

    Acessível apenas para **Admins** e **Gerentes**.
    """
    # Nota: analytics_service precisaria ser adaptado para async se fizesse chamadas async ao DB
    # Por enquanto, se ele só lê, pode funcionar com db.run_sync() ou ser reescrito.
    # Assumindo que pode ser chamado diretamente por agora ou que será adaptado.
    # Se analytics_service for síncrono:
    # suggestions = await db.run_sync(analytics_service.get_purchase_suggestions)
    # Se analytics_service for assíncrono:
    suggestions = await analytics_service.get_purchase_suggestions(db) # Supondo que foi adaptado para async
    # Se analytics_service.get_purchase_suggestions for SÍNCRONO, use:
    # suggestions = await db.run_sync(analytics_service.get_purchase_suggestions)

    # Verifique qual abordagem analytics_service usa. Pelo código fornecido,
    # ele parece ser SÍNCRONO (usa `db: Session`). Portanto, o `db.run_sync` seria o correto.
    # Vamos usar run_sync assumindo que analytics_service NÃO foi reescrito para async:
    try:
      suggestions = await db.run_sync(analytics_service.get_purchase_suggestions)
    except Exception as e:
       # Log do erro seria útil aqui
       raise HTTPException(status_code=500, detail=f"Erro ao buscar sugestões: {e}")
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
    # crud_report.get_top_selling_products PRECISA ser async
    return await crud_report.get_top_selling_products(db, limit=limit)


@router.get("/sales-by-user", response_model=List[SalesByUser])
async def report_sales_by_user(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # crud_report.get_sales_by_user PRECISA ser async
    return await crud_report.get_sales_by_user(db, start_date=start_date, end_date=end_date)

@router.get("/sales-evolution", response_model=List[SalesEvolutionItem])
async def report_sales_evolution(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ Retorna dados de vendas diárias para o gráfico de evolução. """
    # crud_report.get_sales_evolution_by_period PRECISA ser async
    return await crud_report.get_sales_evolution_by_period(db, start_date=start_date, end_date=end_date)

@router.get(
    "/dashboard",
    response_model=dashboard_schemas.DashboardSummary,
    dependencies=[Depends(manager_permissions)],
    summary="Obter Dados Consolidados para o Dashboard"
)
async def get_dashboard_summary( # Keep async def
    *,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Recupera um resumo de dados e KPIs para o dashboard da loja do utilizador autenticado.
    """
    if not current_user.store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilizador não está associado a uma loja."
        )
    # --- CORREÇÃO: Adicionar 'await' aqui ---
    summary_data = await dashboard_service.get_dashboard_summary(db, store_id=current_user.store_id) # Use await here!
    return summary_data