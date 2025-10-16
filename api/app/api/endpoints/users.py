from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any

from app import crud
from app.models.user import User as UserModel
from app.schemas.user import User as UserSchema, UserCreate
from app.api.dependencies import get_db, RoleChecker, get_current_active_user
from app.schemas.enums import UserRole

router = APIRouter()
admin_permissions = RoleChecker([UserRole.ADMIN, UserRole.SUPER_ADMIN])

@router.post("/", response_model=UserSchema, status_code=status.HTTP_201_CREATED)
async def create_user(
    *, 
    db: AsyncSession = Depends(get_db), 
    user_in: UserCreate
) -> Any:
    """
    Cria um novo utilizador no sistema.
    """
    user = await crud.user.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(
            status_code=400,
            detail="Já existe um utilizador com este email no sistema.",
        )
    
    return await crud.user.create(db, obj_in=user_in)

@router.get("/", response_model=List[UserSchema], dependencies=[Depends(admin_permissions)])
async def read_users(
    *,
    db: AsyncSession = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Retorna uma lista de utilizadores.
    """
    return await crud.user.get_multi(db, skip=skip, limit=limit, current_user=current_user)

# Adicione aqui os outros endpoints (GET por id, UPDATE, DELETE) seguindo o mesmo padrão async