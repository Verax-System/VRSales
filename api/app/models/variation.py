from sqlalchemy import String, Integer, Float, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List

from app.db.base import Base

# --- MODELOS UNIFICADOS ---

class Attribute(Base):
    """ Define um tipo de variação. Ex: Cor, Tamanho, Voltagem. """
    __tablename__ = "attributes"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    options: Mapped[List["AttributeOption"]] = relationship(back_populates="attribute")

class AttributeOption(Base):
    """ Define um valor para um atributo. Ex: Azul, Vermelho, P, M, G. """
    __tablename__ = "attribute_options"
    id: Mapped[int] = mapped_column(primary_key=True)
    value: Mapped[str] = mapped_column(String(50), nullable=False)
    attribute_id: Mapped[int] = mapped_column(ForeignKey("attributes.id"))

    attribute: Mapped["Attribute"] = relationship(back_populates="options")

class ProductVariation(Base):
    """ Representa uma variação específica de um produto (SKU). """
    __tablename__ = "product_variations"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    
    price: Mapped[float] = mapped_column(Float, nullable=False)
    stock: Mapped[int] = mapped_column(Integer, default=0)
    barcode: Mapped[str] = mapped_column(String(100), unique=True, nullable=True)

    product: Mapped["Product"] = relationship(back_populates="variations")
    options: Mapped[List["AttributeOption"]] = relationship(secondary="variation_options_association")

class VariationOptionsAssociation(Base):
    """ Tabela de associação para ligar uma Variação a suas Opções. """
    __tablename__ = "variation_options_association"
    variation_id: Mapped[int] = mapped_column(ForeignKey("product_variations.id"), primary_key=True)
    option_id: Mapped[int] = mapped_column(ForeignKey("attribute_options.id"), primary_key=True)