from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import timedelta # Importa timedelta para o filtro

# --- INÍCIO DA CORREÇÃO ---
from app import crud
from app.schemas.batch import ProductBatch, ProductBatchCreate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user
# --- FIM DA CORREÇÃO ---


router = APIRouter()

@router.post("/", response_model=ProductBatch)
async def create_batch(
    batch_in: ProductBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ Adiciona um novo lote de produto ao estoque. """
    return await crud.batch.create_product_batch(db=db, batch_in=batch_in)


@router.get("/", response_model=List[ProductBatch])
async def read_batches(
    expiring_soon_days: Optional[int] = Query(None, description="Filtrar por lotes vencendo nos próximos X dias"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ Lista todos os lotes, com opção de filtro por data de validade. """
    return await crud.batch.get_batches(db, expiring_soon_days=expiring_soon_days)


@router.delete("/{batch_id}", response_model=ProductBatch)
async def delete_batch(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """ Dá baixa manual em um lote completo. """
    deleted_batch = await crud.batch.remove_batch(db, batch_id=batch_id)
    if not deleted_batch:
        raise HTTPException(status_code=404, detail="Lote não encontrado")
    return deleted_batch