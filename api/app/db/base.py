from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import func
from datetime import datetime

class Base(DeclarativeBase):
    """
    Classe base declarativa da qual todos os modelos ORM herdarão.
    """
    pass

# Importamos os modelos aqui para que o Alembic possa "encontrá-los"
# quando estiver procurando por metadados para autogerar as migrations.
from app.models.product import Product
from app.models.user import User # <-- ADICIONE ESTA LINHA
from app.models.customer import Customer # <-- ADICIONE
from app.models.sale import Sale, SaleItem # <-- ADICIONE
from app.models.cash_register import CashRegisterSession # <-- ADICIONE
from app.models.supplier import Supplier # <-- ADICIONE ESTA LINHA
from app.models.ingredient import Ingredient # <-- ADICIONE
from app.models.recipe import RecipeItem
from app.models.table import Table       # <-- ADICIONE
from app.models.order import Order, OrderItem
from app.models.additional import Additional, OrderItemAdditional # <-- ADICIONE
from app.models.batch import ProductBatch # <-- ADICIONE
