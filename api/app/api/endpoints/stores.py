# api/app/api/endpoints/stores.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import crud
from app.models.user import User as UserModel
from app.schemas.store import Store as StoreSchema, StoreCreate, StoreUpdate
from app.api.dependencies import get_db, get_current_active_user, RoleChecker
from app.schemas.enums import UserRole

router = APIRouter()

super_admin_permissions = RoleChecker([UserRole.SUPER_ADMIN])


@router.post(
    "/",
    response_model=StoreSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(super_admin_permissions)]
)
async def create_store(
    *,
    db: AsyncSession = Depends(get_db),
    store_in: StoreCreate,
    # Passamos o current_user para o método create para consistência
    current_user: UserModel = Depends(get_current_active_user)
):
    """
    Cria uma nova loja no sistema.
    **Acessível apenas para Super Administradores.**
    """
    # O método create no CRUDBase modificado não exigirá store_id para o modelo Store
    return await crud.store.create(db=db, obj_in=store_in, current_user=current_user)


@router.get(
    "/",
    response_model=List[StoreSchema],
    dependencies=[Depends(super_admin_permissions)]
)
async def read_stores(
    *, # Adicionado para forçar argumentos nomeados
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    # --- INÍCIO DA CORREÇÃO ---
    current_user: UserModel = Depends(get_current_active_user)
    # --- FIM DA CORREÇÃO ---
):
    """
    Lista todas as lojas do sistema.
    **Acessível apenas para Super Administradores.**
    """
    # --- Passando o argumento que faltava ---
    stores = await crud.store.get_multi(db, skip=skip, limit=limit, current_user=current_user)
    return stores


# Os outros endpoints também precisam do current_user
@router.get("/{store_id}", response_model=StoreSchema, dependencies=[Depends(super_admin_permissions)])
async def read_store(
    *,
    db: AsyncSession = Depends(get_db),
    store_id: int,
    current_user: UserModel = Depends(get_current_active_user)
):
    store = await crud.store.get(db, id=store_id, current_user=current_user)
    if not store:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")
    return store

@router.put("/{store_id}", response_model=StoreSchema, dependencies=[Depends(super_admin_permissions)])
async def update_store(
    *,
    db: AsyncSession = Depends(get_db),
    store_id: int,
    store_in: StoreUpdate,
    current_user: UserModel = Depends(get_current_active_user)
):
    db_store = await crud.store.get(db, id=store_id, current_user=current_user)
    if not db_store:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")
    return await crud.store.update(db=db, db_obj=db_store, obj_in=store_in, current_user=current_user)

@router.delete("/{store_id}", response_model=StoreSchema, dependencies=[Depends(super_admin_permissions)])
async def delete_store(
    *,
    db: AsyncSession = Depends(get_db),
    store_id: int,
    current_user: UserModel = Depends(get_current_active_user)
):
    store = await crud.store.remove(db, id=store_id, current_user=current_user)
    if not store:
        raise HTTPException(status_code=404, detail="Loja não encontrada.")
    return store