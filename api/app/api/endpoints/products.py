from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# --- INÍCIO DA CORREÇÃO ---
# Importações explícitas e diretas para cada módulo necessário
from app import crud
from app.models.user import User as UserModel # Importa o modelo User diretamente
from app.schemas.product import Product as ProductSchema, ProductCreate, ProductUpdate
from app.schemas.stock import StockAdjustment
from app.api.dependencies import get_db, RoleChecker, get_current_active_user
from app.schemas.enums import UserRole
from app.services.stock_service import stock_service
# --- FIM DA CORREGE ---

router = APIRouter()

# Define as permissões necessárias.
manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER])

@router.post(
    "/",
    response_model=ProductSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(manager_permissions)],
    summary="Criar um novo produto"
)
def create_product(
    *,
    db: Session = Depends(get_db),
    product_in: ProductCreate,
    current_user: UserModel = Depends(get_current_active_user) # Usa o UserModel importado
):
    """
    Cria um novo produto na loja do usuário autenticado.
    A CRUDBase irá associar automaticamente o produto à `store_id` correta.
    """
    return crud.product.create(db=db, obj_in=product_in, current_user=current_user)

@router.get(
    "/",
    response_model=List[ProductSchema],
    summary="Listar produtos da loja"
)
def read_products(
    *,
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_user) # Usa o UserModel importado
):
    """
    Retorna uma lista de produtos pertencentes à loja do usuário autenticado.
    A filtragem por `store_id` é feita automaticamente pela CRUDBase.
    """
    products = crud.product.get_multi(db, skip=skip, limit=limit, current_user=current_user)
    return products

@router.get(
    "/{product_id}",
    response_model=ProductSchema,
    summary="Obter um produto por ID"
)
def read_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: UserModel = Depends(get_current_active_user) # Usa o UserModel importado
):
    """
    Obtém os detalhes de um produto específico, garantindo que ele
    pertença à loja do usuário autenticado.
    """
    product = crud.product.get(db, id=product_id, current_user=current_user)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado ou não pertence a esta loja."
        )
    return product

@router.put(
    "/{product_id}",
    response_model=ProductSchema,
    dependencies=[Depends(manager_permissions)],
    summary="Atualizar um produto"
)
def update_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    product_in: ProductUpdate,
    current_user: UserModel = Depends(get_current_active_user) # Usa o UserModel importado
):
    """
    Atualiza as informações de um produto. A CRUDBase garante que o usuário
    só possa atualizar produtos da sua própria loja.
    """
    db_product = crud.product.get(db, id=product_id, current_user=current_user)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado ou não pertence a esta loja."
        )
    product = crud.product.update(db=db, db_obj=db_product, obj_in=product_in, current_user=current_user)
    return product

@router.delete(
    "/{product_id}",
    response_model=ProductSchema,
    dependencies=[Depends(manager_permissions)],
    summary="Deletar um produto"
)
def delete_product(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    current_user: UserModel = Depends(get_current_active_user) # Usa o UserModel importado
):
    """
    Remove um produto do sistema, garantindo que pertença à loja
    do usuário autenticado.
    """
    product = crud.product.remove(db=db, id=product_id, current_user=current_user)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado ou não pertence a esta loja."
        )
    return product

@router.post(
    "/{product_id}/stock-adjustment",
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(manager_permissions)],
    summary="Ajustar o estoque de um produto"
)
def adjust_product_stock(
    *,
    db: Session = Depends(get_db),
    product_id: int,
    adjustment_in: StockAdjustment,
    current_user: UserModel = Depends(get_current_active_user) # Usa o UserModel importado
):
    """
    Realiza um ajuste manual no estoque de um produto da loja atual.
    """
    product_to_adjust = crud.product.get(db, id=product_id, current_user=current_user)
    if not product_to_adjust:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado ou não pertence a esta loja."
        )

    movement = stock_service.adjust_stock(
        db=db,
        product_id=product_id,
        new_stock_level=adjustment_in.new_stock_level,
        user=current_user,
        reason=adjustment_in.reason
    )
        
    return {"message": "Estoque ajustado com sucesso.", "new_stock_level": movement.stock_after_movement}