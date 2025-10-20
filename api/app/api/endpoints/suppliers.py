from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app import crud # Importa o pacote crud inteiro
from app.models.user import User as UserModel
from app.schemas.supplier import Supplier, SupplierCreate, SupplierUpdate
from app.api.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.post("/", response_model=Supplier, status_code=status.HTTP_201_CREATED)
async def create_supplier(
    *,
    db: AsyncSession = Depends(get_db),
    supplier_in: SupplierCreate,
    current_user: UserModel = Depends(get_current_active_user)
):
    """ Cria um novo fornecedor para a loja do usuário logado. """
    # --- CORREÇÃO AQUI ---
    # Chamada corrigida para crud.supplier.create (removido o .supplier extra)
    return await crud.supplier.create(db=db, obj_in=supplier_in, current_user=current_user)

@router.get("/", response_model=List[Supplier])
async def read_suppliers(
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_user)
):
    """ Lista todos os fornecedores da loja do usuário logado. """
    # --- CORREÇÃO AQUI ---
    return await crud.supplier.get_multi(db, skip=skip, limit=limit, current_user=current_user)

@router.put("/{supplier_id}", response_model=Supplier)
async def update_supplier(
    *,
    db: AsyncSession = Depends(get_db),
    supplier_id: int,
    supplier_in: SupplierUpdate,
    current_user: UserModel = Depends(get_current_active_user)
):
    """ Atualiza um fornecedor da loja do usuário logado. """
    supplier = await crud.supplier.get(db=db, id=supplier_id, current_user=current_user)
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    # --- CORREÇÃO AQUI ---
    return await crud.supplier.update(db=db, db_obj=supplier, obj_in=supplier_in)

@router.delete("/{supplier_id}", response_model=Supplier)
async def delete_supplier(
    *,
    db: AsyncSession = Depends(get_db),
    supplier_id: int,
    current_user: UserModel = Depends(get_current_active_user)
):
    """ Deleta um fornecedor da loja do usuário logado. """
    supplier = await crud.supplier.get(db=db, id=supplier_id, current_user=current_user)
    if not supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    # --- CORREÇÃO AQUI ---
    return await crud.supplier.remove(db=db, id=supplier_id, current_user=current_user)