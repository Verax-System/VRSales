from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- CORREÇÃO AQUI ---
from app.crud import crud_table
from app.schemas.table import Table, TableCreate, TableUpdate, TableLayoutUpdateRequest
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.post("/", response_model=Table)
async def create_table(
    table_in: TableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_table.create_table(db=db, table=table_in)

@router.get("/", response_model=List[Table])
async def read_tables(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud_table.get_tables(db)

@router.put("/layout", response_model=List[Table])
async def update_tables_layout(
    layout_in: TableLayoutUpdateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza a posição (pos_x, pos_y) de múltiplas mesas de uma vez."""
    updated_tables = []
    for table_data in layout_in.tables:
        db_table = await crud_table.get_table(db, table_id=table_data.id)
        if db_table:
            update_data = TableUpdate(pos_x=table_data.pos_x, pos_y=table_data.pos_y)
            updated = await crud_table.update_table(db=db, db_table=db_table, table_in=update_data)
            updated_tables.append(updated)
    return updated_tables


@router.put("/{table_id}", response_model=Table)
async def update_table_status(
    table_id: int,
    table_in: TableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_table = await crud_table.get_table(db, table_id=table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    return await crud_table.update_table(db=db, db_table=db_table, table_in=table_in)