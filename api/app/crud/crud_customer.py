from sqlalchemy.orm import Session

from app.crud.base import CRUDBase
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate

class CRUDCustomer(CRUDBase[Customer, CustomerCreate, CustomerUpdate]):
    """Operações CRUD para Clientes."""
    # Aqui poderíamos adicionar métodos como 'get_by_phone_number', por exemplo.
    pass

customer = CRUDCustomer(Customer)