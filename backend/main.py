import json
import logging
import os
import secrets
from collections import Counter
from decimal import Decimal
from typing import Annotated
from urllib.request import Request, urlopen

from fastapi import APIRouter, BackgroundTasks, Depends, FastAPI, Header, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.orm import Session

from database import get_db
from models import Categoria, Producto, Venta
from schemas import (
    MAX_MONEY, MAX_QUANTITY, CategoriaOut, ProductId, ProductoIn, ProductoOut,
    VentaIn, VentaLineaOut, VentaOut,
)

log = logging.getLogger(__name__)
app = FastAPI(title="API TecnoNova", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
                   if origin.strip()],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type", "X-Admin-Key"],
)
api = APIRouter(prefix="/api/v1")
DB = Annotated[Session, Depends(get_db)]
AdminHeader = Annotated[str | None, Header(alias="X-Admin-Key")]


def verificar_admin(x_admin_key: AdminHeader = None):
    expected = os.getenv("ADMIN_API_KEY", "")
    if not expected.strip():
        raise HTTPException(503, "Administración no configurada")
    if not x_admin_key or not secrets.compare_digest(x_admin_key.encode(), expected.encode()):
        raise HTTPException(401, "Clave de administración inválida")


admin = [Depends(verificar_admin)]


@app.exception_handler(SQLAlchemyError)
async def database_error(_request, error):
    log.warning("Operación de base de datos fallida (%s)", type(error).__name__)
    if isinstance(error, IntegrityError):
        return JSONResponse({"detail": "Conflicto con los datos existentes"}, status_code=409)
    return JSONResponse({"detail": "Base de datos no disponible"}, status_code=503)


@app.get("/health")
def health(db: DB):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "database": "ok"}


@api.get("/admin/check", dependencies=admin)
def admin_check():
    return {"status": "ok"}


@api.get("/categorias", response_model=list[CategoriaOut])
def categorias(db: DB):
    return db.scalars(select(Categoria).order_by(Categoria.id)).all()


@api.get("/productos", response_model=list[ProductoOut])
def productos(db: DB, incluir_inactivos: bool = False, x_admin_key: AdminHeader = None):
    query = select(Producto).order_by(Producto.id)
    if incluir_inactivos:
        verificar_admin(x_admin_key)
    else:
        query = query.where(Producto.activo.is_(True))
    return db.scalars(query).all()


def verificar_categoria(db: Session, categoria_id: int):
    if db.get(Categoria, categoria_id) is None:
        raise HTTPException(404, "Categoría no encontrada")


def bloquear_producto(db: Session, producto_id: int):
    product = db.scalar(select(Producto).where(Producto.id == producto_id).with_for_update())
    if product is None:
        raise HTTPException(404, "Producto no encontrado")
    return product


@api.post("/productos", response_model=ProductoOut, status_code=201, dependencies=admin)
def crear_producto(datos: ProductoIn, db: DB):
    with db.begin():
        verificar_categoria(db, datos.categoria_id)
        product = Producto(**datos.model_dump())
        db.add(product)
        db.flush()
    return product


@api.put("/productos/{producto_id}", response_model=ProductoOut, dependencies=admin)
def editar_producto(producto_id: ProductId, datos: ProductoIn, db: DB):
    with db.begin():
        product = bloquear_producto(db, producto_id)
        verificar_categoria(db, datos.categoria_id)
        for name, value in datos.model_dump().items():
            setattr(product, name, value)
    return product


@api.delete("/productos/{producto_id}", status_code=204, dependencies=admin)
def archivar_producto(producto_id: ProductId, db: DB):
    with db.begin():
        bloquear_producto(db, producto_id).activo = False
    return Response(status_code=204)


def notificar_venta(webhook: str, pedido_id: str, total: str):
    try:
        body = json.dumps({"text": f"TecnoNova: pedido {pedido_id} registrado por Bs. {total}"}).encode()
        request = Request(webhook, data=body, headers={"Content-Type": "application/json"}, method="POST")
        with urlopen(request, timeout=4):
            pass
    except Exception:
        log.warning("No se pudo enviar la notificación de venta")


@api.post("/ventas", response_model=VentaOut, status_code=201, dependencies=admin)
def registrar_venta(datos: VentaIn, db: DB, background: BackgroundTasks):
    quantities: Counter[int] = Counter()
    for item in datos.items:
        quantities[item.producto_id] += item.cantidad
    if any(quantity > MAX_QUANTITY for quantity in quantities.values()):
        raise HTTPException(422, f"Máximo de {MAX_QUANTITY} unidades por producto")

    with db.begin():
        if db.get_bind().dialect.name == "postgresql":
            # A 64-bit hash collision only serializes unrelated orders.
            db.execute(text("SELECT pg_advisory_xact_lock(hashtextextended(:pedido, 0))"),
                       {"pedido": str(datos.pedido_id)})
        lines = list(db.scalars(select(Venta).where(Venta.pedido_id == datos.pedido_id)
                                .order_by(Venta.producto_id)))
        if lines:
            if quantities != {line.producto_id: line.cantidad for line in lines}:
                raise HTTPException(409, "El identificador ya se utilizó con otro carrito")
            return {"pedido_id": datos.pedido_id, "total": sum(line.total for line in lines), "items": lines}

        products = db.scalars(select(Producto).where(Producto.id.in_(quantities))
                              .order_by(Producto.id).with_for_update()).all()
        if len(products) != len(quantities):
            raise HTTPException(404, "Uno o más productos no existen")
        for product in products:
            quantity = quantities[product.id]
            if not product.activo or product.stock < quantity:
                raise HTTPException(409, f"Producto inactivo o con stock insuficiente: {product.nombre}")
            amount = product.precio * quantity
            if amount > MAX_MONEY:
                raise HTTPException(422, "El importe de una línea supera el límite admitido")
            product.stock -= quantity
            lines.append(Venta(pedido_id=datos.pedido_id, producto_id=product.id, nombre_producto=product.nombre,
                               cantidad=quantity, precio_unitario=product.precio, total=amount))
        db.add_all(lines)
        db.flush()

    total = sum((line.total for line in lines), Decimal("0.00"))
    webhook = os.getenv("SLACK_WEBHOOK_URL", "").strip()
    if webhook:
        background.add_task(notificar_venta, webhook, str(datos.pedido_id), str(total))
    return {"pedido_id": datos.pedido_id, "total": total, "items": lines}


@api.get("/ventas", response_model=list[VentaLineaOut], dependencies=admin)
def ventas(db: DB):
    return db.scalars(select(Venta).order_by(Venta.id.desc())).all()


app.include_router(api)
