# api/app/crud/__init__.py

# Este arquivo torna mais fácil importar os objetos e módulos CRUD de outros locais.
# Exemplo: from app.crud import user, product, table

# 1. Importa as instâncias de classes CRUDBase (onde um objeto 'user', 'product' etc. é exportado)
from .crud_user import user
from .crud_product import product
from .crud_customer import customer
from .crud_sale import sale
from .crud_cash_register import cash_register
from .crud_store import store

# 2. Importa os módulos CRUD que são baseados em funções, usando um alias (apelido) para facilitar o acesso.
#    Isso permite que você chame, por exemplo, `crud.table.get_tables()` em vez de `crud.crud_table.get_tables()`.
from . import crud_additional as additional
from . import crud_attribute as attribute
from . import crud_batch as batch
from . import crud_category as category
from . import crud_ingredient as ingredient
from . import crud_order as order
from . import crud_recipe as recipe
from . import crud_report as report
from . import crud_supplier as supplier
from . import crud_table as table  # <-- ESTA É A CORREÇÃO DIRETA PARA O SEU ERRO
from . import crud_variation as variation