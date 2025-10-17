# api/app/api/endpoints/reservations.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Any
from datetime import datetime

from app import crud
from app.models.user import User as UserModel
from app.schemas.reservation import Reservation, ReservationCreate, ReservationUpdate
from app.api.dependencies import get_db, get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[Reservation])
async def read_reservations(
    *,
    db: AsyncSession = Depends(get_db),
    start_date: datetime,
    end_date: datetime,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Lista as reservas num determinado intervalo de datas.
    """
    reservations = await crud.reservation.get_reservations_by_date_range(
        db=db, start_date=start_date, end_date=end_date, current_user=current_user
    )
    return reservations

@router.post("/", response_model=Reservation, status_code=status.HTTP_201_CREATED)
async def create_reservation(
    *,
    db: AsyncSession = Depends(get_db),
    reservation_in: ReservationCreate,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Cria uma nova reserva.
    """
    return await crud.reservation.create(db=db, obj_in=reservation_in, current_user=current_user)

@router.delete("/{reservation_id}", response_model=Reservation)
async def delete_reservation(
    *,
    db: AsyncSession = Depends(get_db),
    reservation_id: int,
    current_user: UserModel = Depends(get_current_active_user)
) -> Any:
    """
    Cancela/apaga uma reserva.
    """
    reservation_to_delete = await crud.reservation.get(db, id=reservation_id, current_user=current_user)
    if not reservation_to_delete:
        raise HTTPException(status_code=404, detail="Reserva não encontrada.")
    
    return await crud.reservation.remove(db=db, id=reservation_id, current_user=current_user)