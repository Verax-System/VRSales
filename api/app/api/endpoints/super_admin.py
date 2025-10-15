from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, RoleChecker
from app.schemas.enums import UserRole
from app.services.dashboard_service import dashboard_service
from app.schemas import super_admin as super_admin_schemas

router = APIRouter()

# Permissão exclusiva para Super Administradores
super_admin_permissions = RoleChecker([UserRole.SUPER_ADMIN])

@router.get(
    "/dashboard",
    response_model=super_admin_schemas.GlobalDashboardSummary,
    dependencies=[Depends(super_admin_permissions)],
    summary="Obter Dados Consolidados Globais para o Dashboard"
)
def get_global_dashboard_summary(
    db: Session = Depends(get_db)
):
    """
    Recupera um resumo completo de dados de TODAS as lojas para alimentar
    o dashboard do Super Administrador.

    **Acessível apenas para Super Administradores.**
    """
    summary_data = dashboard_service.get_global_dashboard_summary(db)
    return summary_data