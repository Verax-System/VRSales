from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- INÍCIO DA CORREÇÃO ---
from app import crud
# Importa os schemas e dependências necessários diretamente
from app.schemas.table import Table, TableCreate, TableUpdate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---

router = APIRouter()

@router.post("/", response_model=Table)
async def create_table(
    table_in: TableCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.create_table(db=db, table=table_in)

@router.get("/", response_model=List[Table])
async def read_tables(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await crud.get_tables(db)

@router.put("/{table_id}", response_model=Table)
async def update_table_status(
    table_id: int,
    table_in: TableUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_table = await crud.get_table(db, table_id=table_id)
    if not db_table:
        raise HTTPException(status_code=404, detail="Mesa não encontrada")
    return await crud.update_table(db=db, db_table=db_table, table_in=table_in)