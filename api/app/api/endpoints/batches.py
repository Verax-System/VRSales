from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

# --- CORREÇÃO PRINCIPAL ---
# Importamos a instância 'batch' diretamente do seu arquivo, em vez de usar 'crud'
from app.crud.crud_batch import batch
# -------------------------

from app.schemas.batch import ProductBatch, ProductBatchCreate
from app.models.user import User as UserModel
from app.models.product import Product
from app.api.dependencies import get_db, get_current_active_user


router = APIRouter()

@router.post("/", response_model=ProductBatch)
async def create_batch(
    batch_in: ProductBatchCreate,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """ Adiciona um novo lote de produto ao estoque da loja do usuário. """
    # Agora a chamada é diretamente para a instância 'batch' que importamos
    return await batch.create(db=db, obj_in=batch_in, current_user=current_user)


@router.get("/", response_model=List[ProductBatch])
async def read_batches(
    expiring_soon_days: Optional[int] = Query(None, description="Filtrar por lotes vencendo nos próximos X dias"),
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """ Lista todos os lotes da loja do usuário, com opção de filtro por data de validade. """
    # A chamada agora usa a função correta da instância 'batch'
    return await batch.get_multi_with_filter(
        db, 
        current_user=current_user, 
        expiring_soon_days=expiring_soon_days
    )


@router.delete("/{batch_id}", response_model=ProductBatch)
async def delete_batch(
    batch_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_active_user)
):
    """ Dá baixa manual em um lote completo da loja do usuário e ajusta o estoque. """
    batch_to_delete = await batch.get(db, id=batch_id, current_user=current_user)
    if not batch_to_delete:
        raise HTTPException(status_code=404, detail="Lote não encontrado ou não pertence a esta loja")

    product = await db.get(Product, batch_to_delete.product_id)
    if product:
        product.stock -= batch_to_delete.quantity
        db.add(product)

    deleted_batch = await batch.remove(db, id=batch_id, current_user=current_user)
    return deleted_batch