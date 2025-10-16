from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Any
from sqlalchemy.ext.asyncio import AsyncSession # Usar AsyncSession

from app.crud import crud_table
from app.models.user import User as UserModel
from app.schemas.table import Table as TableSchema, TableCreate, TableUpdate, TableLayoutUpdate
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.schemas.enums import UserRole

router = APIRouter()
full_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.SUPER_ADMIN])
manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPER_ADMIN])

# --- CORREÇÃO AQUI ---
# 1. A função do endpoint agora é `async def`
# 2. Adicionamos `await` na chamada do CRUD
@router.get("/", response_model=List[TableSchema], dependencies=[Depends(full_permissions)])
async def read_tables(
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Busca todas as mesas da loja do utilizador.
    """
    tables = await crud_table.table.get_multi(db, limit=1000, current_user=current_user)
    return tables

@router.post("/", response_model=TableSchema, status_code=status.HTTP_201_CREATED, dependencies=[Depends(manager_permissions)])
async def create_table(
    *,
    db: AsyncSession = Depends(get_db),
    table_in: TableCreate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Cria uma nova mesa.
    """
    return await crud_table.table.create(db=db, obj_in=table_in, current_user=current_user)

@router.put("/layout", response_model=List[TableSchema], dependencies=[Depends(manager_permissions)])
async def update_tables_layout(
    *,
    db: AsyncSession = Depends(get_db),
    tables_layout: List[TableLayoutUpdate],
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Atualiza a posição (x, y) de múltiplas mesas.
    """
    return await crud_table.table.update_layout(db=db, tables_layout=tables_layout, current_user=current_user)

@router.put("/{table_id}", response_model=TableSchema, dependencies=[Depends(manager_permissions)])
async def update_table(
    *,
    db: AsyncSession = Depends(get_db),
    table_id: int,
    table_in: TableUpdate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Atualiza os dados de uma mesa.
    """
    table = await crud_table.table.get(db=db, id=table_id, current_user=current_user)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada.")
    return await crud_table.table.update(db=db, db_obj=table, obj_in=table_in, current_user=current_user)

@router.delete("/{table_id}", response_model=TableSchema, dependencies=[Depends(manager_permissions)])
async def delete_table(
    *,
    db: AsyncSession = Depends(get_db),
    table_id: int,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Apaga uma mesa.
    """
    table = await crud_table.table.remove(db=db, id=table_id, current_user=current_user)
    if not table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada.")
    return table