import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

# Adiciona o diretório raiz da aplicação ao path do Python
# para que possamos importar nossos módulos (como 'app.core.config').
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

# --- Início da Seção Modificada ---
# Importamos nossa Base e as configurações da nossa aplicação
from app.db.base import Base
from app.core.config import settings
# --- Fim da Seção Modificada ---


# Esta é a configuração do Alembic, que é lida do arquivo .ini.
config = context.config

# --- Início da Seção Modificada ---
# Sobrescreve a URL do banco de dados no objeto de configuração do Alembic
# com a URL vinda das nossas configurações centrais.
# Isso garante que o Alembic se conecte ao mesmo banco de dados que a aplicação.
config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)
# --- Fim da Seção Modificada ---


# Interpreta o arquivo de configuração para logging.
# Esta linha desabilita o logging padrão para evitar duplicação se já configurado.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# --- Início da Seção Modificada ---
# Define o 'target_metadata' para a base declarativa dos nossos modelos.
# É assim que o Alembic sabe quais tabelas devem existir no banco de dados.
target_metadata = Base.metadata
# --- Fim da Seção Modificada ---


def run_migrations_offline() -> None:
    """Executa migrations em modo 'offline'.
    ... (código padrão do Alembic)
    """
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
    """Executa migrations em modo 'online'.
    ... (código padrão do Alembic)
    """
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
