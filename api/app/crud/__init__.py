# Este arquivo torna mais fácil importar os objetos CRUD de outros módulos.
# Exemplo: from app.crud import user, product

from .crud_user import user
from .crud_product import product
from .crud_customer import customer

# Adicione aqui outras importações de CRUD à medida que for refatorando...
# from .crud_sale import sale
# from .crud_order import order