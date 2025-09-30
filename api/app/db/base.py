from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import func
from datetime import datetime

class Base(DeclarativeBase):
    """
    Classe base declarativa da qual todos os modelos ORM herdarão.
    """
    pass

# Importamos o modelo de Produto aqui para que o Alembic possa "encontrá-lo"
# quando estiver procurando por metadados para autogerar as migrations.
# Todos os futuros modelos deverão ser importados aqui também.
from app.models.product import Product
