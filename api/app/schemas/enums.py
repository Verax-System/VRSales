import enum
from enum import Enum

# O (str, enum.Enum) é uma prática recomendada para que o FastAPI/Pydantic
# trate os membros do enum como strings, o que é ideal para APIs JSON.

class UnitOfMeasure(str, enum.Enum):
    """ Unidades de medida para os insumos. """
    KILOGRAM = "kg"
    GRAM = "g"
    LITER = "l"
    MILLILITER = "ml"
    UNIT = "un"

# --- INÍCIO DA NOVA ADIÇÃO ---
class TableShape(str, enum.Enum):
    """ Formatos de mesa disponíveis. """
    RECTANGLE = "rectangle"
    ROUND = "round"
# --- FIM DA NOVA ADIÇÃO ---

class TableStatus(str, enum.Enum):
    """ Status de uma mesa no restaurante. """
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"

class OrderStatus(str, enum.Enum):
    OPEN = "open"
    CLOSED = "closed"
    PAID = "paid"
    CANCELLED = "cancelled"

class OrderType(str, Enum):
    DINE_IN = "DINE_IN"
    DELIVERY = "DELIVERY"
    TAKEOUT = "TAKEOUT"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PIX = "pix"
    OTHER = "other"

class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"

class OrderItemStatus(str, Enum):
    PENDING = "pending"
    PREPARING = "preparing"
    READY = "ready"
    DELIVERED = "delivered"