from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date, datetime # Adicionar datetime
from typing import List, Any
from fastapi.responses import StreamingResponse
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.lib import colors

from app.services.analytics_service import analytics_service
from app.schemas.report import (
    SalesByPeriod, TopSellingProduct, SalesByUser, SalesEvolutionItem, PurchaseSuggestion,
    SalesByPaymentMethodItem, SalesByHourItem, SalesByCategoryItem, LowStockProductItem,
    TopCustomerItem, InactiveCustomerItem
)
from app.schemas import dashboard as dashboard_schemas
from app.api.dependencies import get_db, RoleChecker, get_current_active_user, get_current_user
from app.models.user import User as UserModel
from app.models.store import Store as StoreModel # Importar o modelo da Loja
from app.schemas.enums import UserRole
from app.services.dashboard_service import dashboard_service
from app.crud import crud_report
from app.schemas.user import User as UserSchema

router = APIRouter()

manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER])

# --- Função Auxiliar para Gerar PDF (Aprimorada) ---
def generate_sales_by_period_pdf_content(
    data: SalesByPeriod,
    start_date: date,
    end_date: date,
    store: StoreModel
) -> bytes:
    """Gera o conteúdo de um PDF profissional para o relatório de vendas por período."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    margin = 2 * cm
    
    # --- CABEÇALHO ---
    p.setFont("Helvetica-Bold", 18)
    p.setFillColorRGB(0.1, 0.32, 0.78) # Azul corporativo
    p.drawString(margin, height - margin, "VR Sales")
    
    p.setFont("Helvetica", 10)
    p.setFillColor(colors.black)
    p.drawRightString(width - margin, height - margin + 0.5*cm, store.name)
    p.setFillColor(colors.grey)
    p.drawRightString(width - margin, height - margin, store.address or "Endereço não cadastrado")
    
    p.setStrokeColorRGB(0.9, 0.9, 0.9)
    p.line(margin, height - margin - 0.5*cm, width - margin, height - margin - 0.5*cm)

    # --- TÍTULO DO RELATÓRIO ---
    current_y = height - margin - 2*cm
    p.setFont("Helvetica-Bold", 16)
    p.setFillColor(colors.black)
    p.drawCentredString(width / 2, current_y, "Relatório de Vendas por Período")
    current_y -= 0.7*cm
    p.setFont("Helvetica", 12)
    p.drawCentredString(width / 2, current_y, f"{start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}")

    # --- CONTEÚDO ---
    current_y -= 2*cm
    line_height = 1 * cm
    
    p.setFont("Helvetica-Bold", 12)
    p.drawString(margin, current_y, "Receita Total:")
    p.setFont("Helvetica", 12)
    p.drawRightString(width - margin, current_y, f"R$ {data.total_sales_amount:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'))
    current_y -= line_height

    p.setFont("Helvetica-Bold", 12)
    p.drawString(margin, current_y, "Número de Transações:")
    p.setFont("Helvetica", 12)
    p.drawRightString(width - margin, current_y, str(data.number_of_transactions))
    current_y -= line_height

    p.setFont("Helvetica-Bold", 12)
    p.drawString(margin, current_y, "Ticket Médio:")
    p.setFont("Helvetica", 12)
    p.drawRightString(width - margin, current_y, f"R$ {data.average_ticket:,.2f}".replace(',', 'X').replace('.', ',').replace('X', '.'))
    
    # --- RODAPÉ ---
    footer_y = margin - 1*cm
    p.line(margin, footer_y, width - margin, footer_y)
    footer_text_y = footer_y - 0.5*cm
    p.setFont("Helvetica", 8)
    p.setFillColor(colors.grey)
    p.drawString(margin, footer_text_y, f"Relatório gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    p.drawRightString(width - margin, footer_text_y, "Página 1 de 1")

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()
# --- Fim da Função Auxiliar ---


@router.get("/pdf/sales-by-period",
            response_class=StreamingResponse,
            dependencies=[Depends(manager_permissions)],
            summary="Gerar Relatório PDF de Vendas por Período")
async def generate_sales_by_period_report_pdf(
    start_date: date,
    end_date: date,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user) # Alterado para UserModel
):
    """
    Gera um relatório PDF das vendas por período.
    """
    # 1. Busca os dados da loja do usuário
    if not current_user.store_id:
        raise HTTPException(status_code=400, detail="Usuário não associado a uma loja.")
    store = await db.get(StoreModel, current_user.store_id)
    if not store:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")

    # 2. Busca os dados do relatório
    sales_data: SalesByPeriod = await crud_report.get_sales_by_period(db, start_date=start_date, end_date=end_date)
    
    # 3. Gera o PDF, passando os dados da loja
    pdf_content = generate_sales_by_period_pdf_content(sales_data, start_date, end_date, store)

    # 4. Define o nome do arquivo dinamicamente
    filename = f"relatorio_vendas_{start_date}_a_{end_date}.pdf"

    return StreamingResponse(
        io.BytesIO(pdf_content),
        media_type='application/pdf',
        headers={'Content-Disposition': f'attachment; filename="{filename}"'}
    )

# --- Rotas JSON existentes e comentadas (sem alterações) ---
# ... (o restante do seu arquivo permanece igual) ...

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
    try:
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
    if not current_user.store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Utilizador não está associado a uma loja."
        )
    summary_data = await dashboard_service.get_dashboard_summary(db, store_id=current_user.store_id)
    return summary_data