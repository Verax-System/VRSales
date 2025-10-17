from typing import Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.api import dependencies
from app.models.user import User as UserModel
from app.schemas.enums import UserRole
from app.schemas.user import User as UserSchema, UserCreate

router = APIRouter()

admin_roles = [UserRole.ADMIN, UserRole.SUPER_ADMIN]


@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    *,
    db: AsyncSession = Depends(dependencies.get_db),
    user_in: UserCreate,
    current_user: Optional[UserModel] = Depends(dependencies.get_current_active_user_optional)
) -> Any:
    """
    Cria um novo usuário.
    - Se não houver usuários no sistema, permite a criação do primeiro usuário (super_admin).
    - Se já existirem usuários, a criação exige autenticação de um Admin ou Super Admin.
    """
    user_count = await crud.user.get_count(db)

    if user_count == 0:
        if user_in.role != UserRole.SUPER_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="O primeiro usuário do sistema deve ter a role 'super_admin'.",
            )
        user_in.store_id = None
    else:
        if not current_user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Autenticação necessária.")
        if current_user.role not in admin_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Operação não permitida.")
        if user_in.role == UserRole.SUPER_ADMIN and current_user.role != UserRole.SUPER_ADMIN:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Apenas Super Admins podem criar outros Super Admins.")
        if user_in.role != UserRole.SUPER_ADMIN and user_in.store_id is None:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="O campo 'store_id' é obrigatório para este tipo de usuário.")
        if current_user.role == UserRole.ADMIN and user_in.store_id != current_user.store_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Administradores podem criar usuários apenas para a sua própria loja.")

    user = await crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Já existe um usuário com este e-mail.")
    
    new_user = await crud.user.create(db, obj_in=user_in)
    return new_user

# --- INÍCIO DA CORREÇÃO ---
# Adiciona o endpoint '/me' para o frontend buscar os dados do usuário logado
@router.get("/me", response_model=UserSchema)
async def read_user_me(
    current_user: UserModel = Depends(dependencies.get_current_active_user)
) -> Any:
    """
    Obtém os dados do usuário atualmente autenticado.
    """
    return current_user
# --- FIM DA CORREÇÃO ---


@router.get("/", response_model=List[UserSchema], dependencies=[Depends(dependencies.RoleChecker(admin_roles))])
async def read_users(
    db: AsyncSession = Depends(dependencies.get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Recupera a lista de usuários.
    """
    users = await crud.user.get_multi(db, skip=skip, limit=limit)
    return users