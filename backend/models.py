from datetime import datetime
from decimal import Decimal
from uuid import UUID

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, DateTime, ForeignKey, Identity, Integer,
    Numeric, String, Text, UniqueConstraint, Uuid, func, true,
)
from sqlalchemy.orm import Mapped, mapped_column

from database import Base

ID = BigInteger().with_variant(Integer, "sqlite")


class Categoria(Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(ID, Identity(always=True), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100), unique=True)
    descripcion: Mapped[str] = mapped_column(Text)


class Producto(Base):
    __tablename__ = "productos"
    __table_args__ = (CheckConstraint("precio >= 0"), CheckConstraint("stock >= 0"))

    id: Mapped[int] = mapped_column(ID, Identity(always=True), primary_key=True)
    categoria_id: Mapped[int] = mapped_column(ID, ForeignKey("categorias.id"), index=True)
    nombre: Mapped[str] = mapped_column(String(120))
    marca: Mapped[str] = mapped_column(String(80))
    descripcion: Mapped[str] = mapped_column(Text)
    precio: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    stock: Mapped[int] = mapped_column(Integer)
    modelo_3d: Mapped[str] = mapped_column(Text)
    color: Mapped[str] = mapped_column(String(7))
    activo: Mapped[bool] = mapped_column(Boolean, server_default=true())
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Venta(Base):
    __tablename__ = "ventas"
    __table_args__ = (
        CheckConstraint("cantidad > 0"),
        CheckConstraint("precio_unitario >= 0"),
        CheckConstraint("total >= 0"),
        UniqueConstraint("pedido_id", "producto_id"),
    )

    id: Mapped[int] = mapped_column(ID, Identity(always=True), primary_key=True)
    pedido_id: Mapped[UUID] = mapped_column(Uuid)
    producto_id: Mapped[int] = mapped_column(ID, ForeignKey("productos.id"), index=True)
    nombre_producto: Mapped[str] = mapped_column(String(120))
    cantidad: Mapped[int] = mapped_column(Integer)
    precio_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    total: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
