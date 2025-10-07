import enum

# O (str, enum.Enum) é uma prática recomendada para que o FastAPI/Pydantic
# trate os membros do enum como strings, o que é ideal para APIs JSON.

class UnitOfMeasure(str, enum.Enum):
    """ Unidades de medida para os insumos. """
    KILOGRAM = "kg"
    GRAM = "g"
    LITER = "l"
    MILLILITER = "ml"
    UNIT = "un"

class TableStatus(str, enum.Enum):
    """ Status de uma mesa no restaurante. """
    AVAILABLE = "available"
    OCCUPIED = "occupied"
    RESERVED = "reserved"

class OrderStatus(str, enum.Enum):
    """ Status de uma comanda/pedido. """
    OPEN = "open"
    CLOSED = "closed"
    PAID = "paid"

class OrderType(str, enum.Enum):
    DINE_IN = "dine_in"
    DELIVERY = "delivery"
    TAKEOUT = "takeout"

class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PIX = "pix"
    OTHER = "other"

class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    CASHIER = "cashier"