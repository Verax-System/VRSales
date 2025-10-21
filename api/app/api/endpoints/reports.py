from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
from typing import List, Any

from app.services.analytics_service import analytics_service
from app.schemas.report import (
    SalesByPeriod, TopSellingProduct, SalesByUser, SalesEvolutionItem, PurchaseSuggestion,
    SalesByPaymentMethodItem, SalesByHourItem, SalesByCategoryItem, LowStockProductItem,
    TopCustomerItem, InactiveCustomerItem  # Agora a importação funciona
)
from app.schemas import dashboard as dashboard_schemas
from app.api.dependencies import get_db, RoleChecker, get_current_active_user, get_current_user
from app.models.user import User as UserModel
from app.schemas.enums import UserRole
from app.services.dashboard_service import dashboard_service
from app.crud import crud_report
from app.schemas.user import User as UserSchema
from fastapi.responses import StreamingResponse
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm


router = APIRouter()

manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER])

def generate_sales_by_period_pdf_content(data: SalesByPeriod, start_date: date, end_date: date) -> bytes:
    """Gera o conteúdo de um PDF simples para o relatório de vendas por período."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4 # Largura e altura da página A4

    # Configurações
    margin = 2 * cm
    line_height = 0.7 * cm
    current_y = height - margin

    # Título
    p.setFont("Helvetica-Bold", 16)
    p.drawString(margin, current_y, f"Relatório de Vendas - {start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}")
    current_y -= line_height * 2

    # Dados
    p.setFont("Helvetica", 12)
    p.drawString(margin, current_y, f"Receita Total: R$ {data.total_sales_amount:.2f}".replace('.',','))
    current_y -= line_height
    p.drawString(margin, current_y, f"Número de Transações: {data.number_of_transactions}")
    current_y -= line_height
    p.drawString(margin, current_y, f"Ticket Médio: R$ {data.average_ticket:.2f}".replace('.',','))

    # Adiciona data de geração
    current_y -= line_height * 2
    p.setFont("Helvetica-Oblique", 10)
    p.drawString(margin, current_y, f"Gerado em: {date.today().strftime('%d/%m/%Y')}")

    p.showPage()
    p.save()

    buffer.seek(0)
    return buffer.getvalue()

@router.get("/pdf/sales-by-period",
            response_class=StreamingResponse,
            dependencies=[Depends(manager_permissions)],
            summary="Gerar Relatório PDF de Vendas por Período")
async def generate_sales_by_period_report_pdf(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: UserSchema = Depends(get_current_user)
):
    """
    Gera um relatório PDF das vendas por período.
    """
    # 1. Busca os dados usando a função CRUD existente
    sales_data: SalesByPeriod = await crud_report.get_sales_by_period(db, start_date=start_date, end_date=end_date)

    # 2. Gera o conteúdo do PDF usando a função auxiliar
    pdf_content = generate_sales_by_period_pdf_content(sales_data, start_date, end_date)

    # 3. Define o nome do arquivo
    filename = "relatorio_vendas.pdf"
    # 4. Retorna a resposta como um stream de bytes
    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )

# --- INÍCIO DA CORREÇÃO: Removendo endpoints não implementados ---

# TODO: A lógica para os endpoints abaixo precisa ser criada em `crud/crud_report.py`
# Eles foram comentados para permitir que o servidor inicie sem erros.

@router.get("/sales-by-payment-method", response_model=List[SalesByPaymentMethodItem])
async def report_sales_by_payment_method(
     start_date: date,
     end_date: date,
     db: AsyncSession = Depends(get_db),
     current_user: UserSchema = Depends(get_current_user)
 ):
     return await crud_report.get_sales_by_payment_method(db, start_date=start_date, end_date=end_date)

@router.get("/sales-by-hour", response_model=List[SalesByHourItem])
async def report_sales_by_hour(
     start_date: date,
     end_date: date,
     db: AsyncSession = Depends(get_db),
     current_user: UserSchema = Depends(get_current_user)
 ):
     return await crud_report.get_sales_by_hour(db, start_date=start_date, end_date=end_date)

@router.get("/sales-by-category", response_model=List[SalesByCategoryItem])
async def report_sales_by_category(
     start_date: date,
     end_date: date,
     db: AsyncSession = Depends(get_db),
     current_user: UserSchema = Depends(get_current_user)
 ):
     return await crud_report.get_sales_by_category(db, start_date=start_date, end_date=end_date)

@router.get(
    "/purchase-suggestions",
    response_model=List[PurchaseSuggestion],
    dependencies=[Depends(manager_permissions)],
    summary="Obter Sugestões de Compra de Estoque"
)
async def get_purchase_suggestions(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Analisa os produtos com estoque baixo e o histórico de vendas para
    gerar uma lista inteligente de sugestões de compra.

    Acessível apenas para **Admins** e **Gerentes**.
    """
    try:
      # A função do serviço é síncrona, então usamos run_sync
      suggestions = await db.run_sync(analytics_service.get_purchase_suggestions)
    except Exception as e:
       raise HTTPException(status_code=500, detail=f"Erro ao buscar sugestões: {e}")
    return suggestions

@router.get("/sales-by-period", response_model=SalesByPeriod)
async def report_sales_by_period(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: UserSchema = Depends(get_current_user)
):
    return await crud_report.get_sales_by_period(db, start_date=start_date, end_date=end_date)


@router.get("/top-selling-products", response_model=List[TopSellingProduct])
async def report_top_selling_products(
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: UserSchema = Depends(get_current_user)
):
    return await crud_report.get_top_selling_products(db, limit=limit)


@router.get("/sales-by-user", response_model=List[SalesByUser])
async def report_sales_by_user(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: UserSchema = Depends(get_current_user)
):
    return await crud_report.get_sales_by_user(db, start_date=start_date, end_date=end_date)

@router.get("/sales-evolution", response_model=List[SalesEvolutionItem])
async def report_sales_evolution(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: UserSchema = Depends(get_current_user)
):
    """ Retorna dados de vendas diárias para o gráfico de evolução. """
    return await crud_report.get_sales_evolution_by_period(db, start_date=start_date, end_date=end_date)

@router.get(
    "/dashboard",
    response_model=dashboard_schemas.DashboardSummary,
    dependencies=[Depends(manager_permissions)],
    summary="Obter Dados Consolidados para o Dashboard"
)
async def get_dashboard_summary(
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
    summary_data = await dashboard_service.get_dashboard_summary(db, store_id=current_user.store_id)
    return summary_data