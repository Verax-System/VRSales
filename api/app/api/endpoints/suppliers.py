from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

# --- Imports corrigidos e completos ---
from app import crud
from app.schemas.supplier import Supplier, SupplierCreate, SupplierUpdate
from app.schemas.user import User
from app.api.dependencies import get_db, get_current_user

router = APIRouter()

@router.post("/", response_model=Supplier)
async def create_supplier(
    supplier_in: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Cria um novo fornecedor."""
    return await crud.create_supplier(db=db, supplier=supplier_in)

@router.get("/", response_model=List[Supplier])
async def read_suppliers(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retorna uma lista de fornecedores."""
    return await crud.get_suppliers(db, skip=skip, limit=limit)

@router.get("/{supplier_id}", response_model=Supplier)
async def read_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Busca um único fornecedor pelo ID."""
    db_supplier = await crud.get_supplier(db, supplier_id=supplier_id)
    if db_supplier is None:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    return db_supplier

# --- INÍCIO DO NOVO CÓDIGO ---

@router.put("/{supplier_id}", response_model=Supplier)
async def update_supplier(
    supplier_id: int,
    supplier_in: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Atualiza um fornecedor."""
    db_supplier = await crud.get_supplier(db, supplier_id=supplier_id)
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    
    updated_supplier = await crud.update_supplier(db=db, db_supplier=db_supplier, supplier_in=supplier_in)
    return updated_supplier

@router.delete("/{supplier_id}", response_model=Supplier)
async def delete_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Exclui um fornecedor."""
    deleted_supplier = await crud.remove_supplier(db, supplier_id=supplier_id)
    if not deleted_supplier:
        raise HTTPException(status_code=404, detail="Fornecedor não encontrado")
    return deleted_supplier

# --- FIM DO NOVO CÓDIGO ---