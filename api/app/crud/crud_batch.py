from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import asc
from sqlalchemy.orm import joinedload
from typing import List, Optional
from fastapi import HTTPException
from datetime import date, timedelta

from app.crud.base import CRUDBase
from app.models.batch import ProductBatch  # <-- Este é o MODELO do banco
from app.models.product import Product
from app.models.user import User
# --- CORREÇÃO PRINCIPAL AQUI ---
# Renomeamos o schema para evitar conflito com o modelo
from app.schemas.batch import ProductBatchCreate, ProductBatch as ProductBatchSchema

class CRUDProductBatch(CRUDBase[ProductBatch, ProductBatchCreate, ProductBatchCreate]):
    
    async def create(self, db: AsyncSession, *, obj_in: ProductBatchCreate, current_user: User) -> ProductBatchSchema:
        """
        Cria um novo lote, validando se o produto pertence à loja do usuário
        e atualiza o estoque consolidado do produto.
        """
        product = await db.get(Product, obj_in.product_id)
        if not product or product.store_id != current_user.store_id:
            raise HTTPException(status_code=404, detail=f"Produto com ID {obj_in.product_id} não encontrado nesta loja.")

        db_batch = await super().create(db, obj_in=obj_in, current_user=current_user)
        
        product.stock += obj_in.quantity
        db.add(product)
        
        await db.commit()
        
        # Recarrega o lote com os dados do produto para retornar ao frontend sem erros
        stmt = select(self.model).where(self.model.id == db_batch.id).options(joinedload(self.model.product))
        result = await db.execute(stmt)
        return result.scalars().first()

    async def get_multi_with_filter(
        self, 
        db: AsyncSession, 
        *, 
        current_user: User,
        expiring_soon_days: Optional[int] = None
    ) -> List[ProductBatchSchema]:
        """
        Lista todos os lotes da loja do usuário, com opção de filtro,
        e já carrega a informação do produto associado.
        """
        query = (
            select(self.model)
            .where(self.model.store_id == current_user.store_id)
            .options(joinedload(self.model.product))
            .order_by(asc(self.model.expiration_date))
        )
        
        if expiring_soon_days is not None:
            today = date.today()
            expiration_limit = today + timedelta(days=expiring_soon_days)
            query = query.where(
                self.model.expiration_date >= today,
                self.model.expiration_date <= expiration_limit
            )
            
        result = await db.execute(query)
        return result.scalars().all()

# Exporta uma instância da classe, que será importada como 'crud.batch'
batch = CRUDProductBatch(ProductBatch)