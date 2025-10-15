from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# --- INÍCIO DA CORREÇÃO ---
# Importações explícitas e diretas em vez de genéricas
from app import models
from app.schemas.store import Store as StoreSchema, StoreCreate
from app.api.dependencies import get_db, RoleChecker
from app.schemas.enums import UserRole
# --- FIM DA CORREÇÃO ---

router = APIRouter()

# Permissão exclusiva para Super Administradores
super_admin_permissions = RoleChecker([UserRole.SUPER_ADMIN])


@router.post(
    "/",
    response_model=StoreSchema, # Usa o nome 'StoreSchema' que definimos na importação
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(super_admin_permissions)]
)
def create_store(
    *,
    db: Session = Depends(get_db),
    store_in: StoreCreate
):
    """
    Cria uma nova loja no sistema.
    **Acessível apenas para Super Administradores.**
    """
    store_data = store_in.dict()
    db_obj = models.Store(**store_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.get(
    "/",
    response_model=List[StoreSchema], # Usa o nome 'StoreSchema' que definimos na importação
    dependencies=[Depends(super_admin_permissions)]
)
def read_stores(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """
    Lista todas as lojas do sistema.
    **Acessível apenas para Super Administradores.**
    """
    stores = db.query(models.Store).offset(skip).limit(limit).all()
    return stores