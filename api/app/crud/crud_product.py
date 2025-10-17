from sqlalchemy.orm import Session, selectinload, joinedload
from sqlalchemy.future import select
from typing import List, Any, Dict, Union, Optional
from app.models.user import User as UserModel

from app.crud.base import CRUDBase
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductUpdate
from fastapi.encoders import jsonable_encoder

class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    # ... (métodos _get_product_with_relations e get permanecem iguais) ...
    async def _get_product_with_relations(self, db: Session, product_id: int) -> Product | None:
        """Método auxiliar para buscar um produto com todos os seus relacionamentos."""
        statement = (
            select(Product)
            .where(Product.id == product_id)
            .options(
                selectinload(Product.variations),
                joinedload(Product.category),
                joinedload(Product.subcategory)
            )
        )
        result = await db.execute(statement)
        return result.scalars().first()

    async def get(self, db: Session, id: Any, *, current_user: UserModel) -> Product | None:
        """Obtém um produto pelo ID, garantindo que pertence à loja do usuário."""
        product = await self._get_product_with_relations(db, id)
        if product and product.store_id == current_user.store_id:
            return product
        return None

    # CORREÇÃO: Modificamos get_multi para aceitar o parâmetro de busca
    async def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100, 
        current_user: UserModel,
        search: Optional[str] = None
    ) -> List[Product]:
        """
        Obtém uma lista de produtos da loja do usuário, com busca opcional por nome.
        """
        statement = (
            select(self.model)
            .where(self.model.store_id == current_user.store_id)
            .options(
                selectinload(self.model.variations),
                joinedload(self.model.category),
                joinedload(self.model.subcategory)
            )
            .order_by(self.model.name) # Ordena por nome para melhor usabilidade
        )
        
        # Se um termo de busca for fornecido, adiciona o filtro
        if search:
            statement = statement.where(self.model.name.ilike(f"%{search}%"))

        statement = statement.offset(skip).limit(limit)
        
        result = await db.execute(statement)
        return result.scalars().all()

    # ... (métodos create e update permanecem iguais) ...
    async def create(self, db: Session, *, obj_in: ProductCreate, current_user: UserModel) -> Product:
        """
        Cria um novo produto e o retorna com todos os relacionamentos carregados.
        """
        db_obj = await super().create(db=db, obj_in=obj_in, current_user=current_user)
        return await self._get_product_with_relations(db, db_obj.id)

    async def update(
        self, db: Session, *, db_obj: Product, obj_in: Union[ProductUpdate, Dict[str, Any]], current_user: UserModel
    ) -> Product:
        """
        Atualiza um produto e o retorna com todos os relacionamentos carregados.
        """
        await super().update(db=db, db_obj=db_obj, obj_in=obj_in, current_user=current_user)
        return await self._get_product_with_relations(db, db_obj.id)


product = CRUDProduct(Product)