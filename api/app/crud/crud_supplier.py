from app.crud.base import CRUDBase
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierUpdate

class CRUDSupplier(CRUDBase[Supplier, SupplierCreate, SupplierUpdate]):
    # A classe CRUDBase já contém toda a lógica necessária para
    # criar, ler, atualizar e deletar fornecedores,
    # garantindo que cada operação seja restrita à loja do usuário logado.
    pass

# Exporta uma instância da classe, que será importada como 'crud.supplier'
supplier = CRUDSupplier(Supplier)