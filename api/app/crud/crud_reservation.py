# api/app/crud/crud_reservation.py

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from typing import List
from datetime import datetime

from app.crud.base import CRUDBase
from app.models.reservation import Reservation
from app.models.user import User
from app.schemas.reservation import ReservationCreate, ReservationUpdate

class CRUDReservation(CRUDBase[Reservation, ReservationCreate, ReservationUpdate]):
    async def get_reservations_by_date_range(
        self, db: AsyncSession, *, start_date: datetime, end_date: datetime, current_user: User
    ) -> List[Reservation]:
        """
        Busca todas as reservas para a loja do usuário dentro de um intervalo de datas.
        """
        stmt = (
            select(self.model)
            .where(
                self.model.store_id == current_user.store_id,
                self.model.reservation_time >= start_date,
                self.model.reservation_time <= end_date,
            )
            .options(selectinload(self.model.table))
            .order_by(self.model.reservation_time)
        )
        result = await db.execute(stmt)
        return result.scalars().all()

reservation = CRUDReservation(Reservation)