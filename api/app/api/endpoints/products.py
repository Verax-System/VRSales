from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any, Optional

from app import crud
from app.models.user import User as UserModel
from app.schemas.product import Product as ProductSchema, ProductCreate, ProductUpdate
from app.schemas.stock import StockAdjustment
from app.api.dependencies import get_db, RoleChecker, get_current_active_user
from app.schemas.enums import UserRole
from app.services.stock_service import stock_service

router = APIRouter()

manager_permissions = RoleChecker([UserRole.ADMIN, UserRole.MANAGER])

# ... (as rotas create_product, etc. permanecem iguais) ...
@router.post(
    "/",
    response_model=ProductSchema,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(manager_permissions)],
    summary="Criar um novo produto"
)
async def create_product(
    *,
    db: AsyncSession = Depends(get_db),
    product_in: ProductCreate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Cria um novo produto na loja do usuário autenticado.
    """
    return await crud.product.create(db=db, obj_in=product_in, current_user=current_user)


@router.get("/", response_model=List[ProductSchema], summary="Listar produtos da loja")
async def read_products(
    *,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    # CORREÇÃO: Adiciona o parâmetro de busca
    search: Optional[str] = Query(None, description="Filtra produtos pelo nome"),
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Retorna uma lista de produtos da loja do usuário, com opção de busca por nome.
    """
    # Passa o parâmetro 'search' para a camada de CRUD
    return await crud.product.get_multi(db, skip=skip, limit=limit, current_user=current_user, search=search)

# ... (o restante do arquivo products.py permanece igual) ...

@router.get("/{product_id}", response_model=ProductSchema, summary="Obter um produto por ID")
async def read_product(
    *,
    db: AsyncSession = Depends(get_db),
    product_id: int,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Obtém os detalhes de um produto específico.
    """
    product = await crud.product.get(db, id=product_id, current_user=current_user)
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
async def update_product(
    *,
    db: AsyncSession = Depends(get_db),
    product_id: int,
    product_in: ProductUpdate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Atualiza as informações de um produto.
    """
    db_product = await crud.product.get(db, id=product_id, current_user=current_user)
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado ou não pertence a esta loja."
        )
    return await crud.product.update(db=db, db_obj=db_product, obj_in=product_in, current_user=current_user)

@router.delete(
    "/{product_id}",
    response_model=ProductSchema,
    dependencies=[Depends(manager_permissions)],
    summary="Deletar um produto"
)
async def delete_product(
    *,
    db: AsyncSession = Depends(get_db),
    product_id: int,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Remove um produto do sistema.
    """
    product = await crud.product.remove(db=db, id=product_id, current_user=current_user)
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
async def adjust_product_stock(
    *,
    db: AsyncSession = Depends(get_db),
    product_id: int,
    adjustment_in: StockAdjustment,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Realiza um ajuste manual no estoque de um produto da loja atual.
    """
    product_to_adjust = await crud.product.get(db, id=product_id, current_user=current_user)
    if not product_to_adjust:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Produto não encontrado ou não pertence a esta loja."
        )

    movement = await stock_service.adjust_stock(
        db=db,
        product_id=product_id,
        new_stock_level=adjustment_in.new_stock_level,
        user=current_user,
        reason=adjustment_in.reason
    )
        
    return {"message": "Estoque ajustado com sucesso.", "new_stock_level": movement.stock_after_movement}