from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

MAX_QUANTITY = 1000
MAX_MONEY = Decimal("9999999999.99")
Model3D = Literal["laptop", "phone", "headphones", "keyboard", "monitor", "speaker"]
ProductId = Annotated[int, Field(gt=0, le=9223372036854775807)]
Money = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=2)]


class Input(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class Output(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class CategoriaOut(Output):
    id: int
    nombre: str
    descripcion: str


class ProductoIn(Input):
    categoria_id: ProductId
    nombre: Annotated[str, Field(min_length=1, max_length=120)]
    marca: Annotated[str, Field(min_length=1, max_length=80)]
    descripcion: Annotated[str, Field(min_length=1, max_length=2000)]
    precio: Money
    stock: Annotated[int, Field(strict=True, ge=0, le=2147483647)]
    modelo_3d: Model3D
    color: Annotated[str, Field(pattern=r"^#[0-9a-fA-F]{6}$")]
    activo: bool = True


class ProductoOut(Output):
    id: int
    categoria_id: int
    nombre: str
    marca: str
    descripcion: str
    precio: Decimal
    stock: int
    modelo_3d: Model3D
    color: str
    activo: bool
    created_at: datetime


class VentaItemIn(Input):
    producto_id: Annotated[int, Field(strict=True, gt=0, le=9223372036854775807)]
    cantidad: Annotated[int, Field(strict=True, gt=0, le=MAX_QUANTITY)]


class VentaIn(Input):
    pedido_id: UUID
    items: Annotated[list[VentaItemIn], Field(min_length=1, max_length=100)]


class VentaItemOut(Output):
    id: int
    producto_id: int
    nombre_producto: str
    cantidad: int
    precio_unitario: Decimal
    total: Decimal
    created_at: datetime


class VentaLineaOut(VentaItemOut):
    pedido_id: UUID


class VentaOut(Output):
    pedido_id: UUID
    total: Decimal
    items: list[VentaItemOut]
