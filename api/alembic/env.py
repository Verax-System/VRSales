import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context
from app.models.cash_register_transaction import CashRegisterTransaction

# Adiciona o diretório raiz da aplicação ao path do Python
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# --- INÍCIO DA CORREÇÃO ---
# Importamos a Base e TODAS as configurações e modelos aqui.
# Isso garante que, quando o Alembic ler os metadados da Base,
# todos os modelos já estarão definidos e associados a ela.
from app.db.base import Base
from app.core.config import settings
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.sale import Sale, SaleItem
from app.models.cash_register import CashRegisterSession
from app.models.ingredient import Ingredient
from app.models.recipe import RecipeItem
from app.models.additional import Additional, OrderItemAdditional
from app.models.batch import ProductBatch
from app.models.table import Table
from app.models.order import Order, OrderItem
from app.models.payment import Payment
from app.models.category import ProductCategory, ProductSubcategory
from app.models.variation import Attribute, AttributeOption
# Importações que estavam faltando:
from app.models.variation import Attribute, AttributeOption, ProductVariation, VariationOptionsAssociation
# --- FIM DA CORREÇÃO ---


# Esta é a configuração do Alembic, que é lida do arquivo .ini.
config = context.config

# Carrega a URL síncrona para uso exclusivo do Alembic.
config.set_main_option('sqlalchemy.url', os.getenv("SYNC_DATABASE_URL"))


# Interpreta o arquivo de configuração para logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Define o 'target_metadata' para a base declarativa dos nossos modelos.
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Executa migrations em modo 'offline'."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Executa migrations em modo 'online'."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()