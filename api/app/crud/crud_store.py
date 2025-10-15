from app.crud.base import CRUDBase
from app.models.store import Store
from app.schemas.store import StoreCreate, StoreUpdate

class CRUDStore(CRUDBase[Store, StoreCreate, StoreUpdate]):
    """
    Operações CRUD para Lojas.
    Nota: Esta classe CRUD não deve filtrar por store_id,
    pois um super admin precisa ver todas as lojas.
    Vamos ajustar a CRUDBase para lidar com isso.
    """
    pass

store = CRUDStore(Store)