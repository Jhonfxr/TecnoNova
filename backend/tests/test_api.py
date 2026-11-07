import asyncio
import os
import unittest
from decimal import Decimal
from unittest.mock import patch
from uuid import uuid4

import httpx

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["ADMIN_API_KEY"] = "prueba-local"
os.environ["SLACK_WEBHOOK_URL"] = ""

from main import app
from database import Base, engine, SessionLocal

PREFIX = "/api/v1"
KEY = {"X-Admin-Key": "prueba-local"}
PRODUCT = dict(categoria_id=1, nombre=" Laptop ", marca="Nova", descripcion="Equipo", precio="12.35",
               stock=5, modelo_3d="laptop", color="#ABC123", activo=True)


class Client:
    def __getattr__(self, method):
        def request(path, **kwargs):
            async def send():
                async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app),
                                             base_url="http://testserver") as client:
                    return await client.request(method.upper(), path, **kwargs)
            return asyncio.run(send())
        return request


class ApiTests(unittest.TestCase):
    def setUp(self):
        from models import Categoria
        Base.metadata.create_all(engine)
        self.addCleanup(Base.metadata.drop_all, engine)
        with SessionLocal.begin() as db:
            db.add(Categoria(id=1, nombre="Computación", descripcion="Equipos"))
        self.client = Client()

    def product(self, **changes):
        response = self.client.post(PREFIX + "/productos", headers=KEY, json=PRODUCT | changes)
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def sale(self, order, items):
        return self.client.post(PREFIX + "/ventas", headers=KEY, json={
            "pedido_id": str(order), "items": [
                {"producto_id": product, "cantidad": qty} for product, qty in items
            ],
        })

    def test_admin_required_and_catalog_is_public(self):
        self.product(activo=False)
        self.assertEqual(self.client.get(PREFIX + "/productos").json(), [])
        self.assertEqual(self.client.get(PREFIX + "/productos?incluir_inactivos=true").status_code, 401)
        self.assertEqual(self.client.get(PREFIX + "/ventas", headers={"X-Admin-Key": "incorrecta"}).status_code, 401)
        self.assertEqual(self.client.get(PREFIX + "/admin/check", headers=KEY).status_code, 200)
        self.assertEqual(self.client.get("/health").status_code, 200)
        self.assertEqual(len(self.client.get(PREFIX + "/productos?incluir_inactivos=true", headers=KEY).json()), 1)

    def test_admin_fails_closed_without_configuration(self):
        with patch.dict(os.environ, {"ADMIN_API_KEY": ""}):
            self.assertEqual(self.client.get(PREFIX + "/admin/check", headers=KEY).status_code, 503)
            self.assertEqual(self.client.get(PREFIX + "/productos").status_code, 200)

    def test_sale_rejects_client_supplied_prices(self):
        product_id = self.product()["id"]
        response = self.client.post(PREFIX + "/ventas", headers=KEY, json={
            "pedido_id": str(uuid4()), "items": [
                {"producto_id": product_id, "cantidad": 1, "precio_unitario": "0.01"}
            ],
        })
        self.assertEqual(response.status_code, 422)
        self.assertEqual(self.client.get(PREFIX + "/productos").json()[0]["stock"], 5)

    def test_product_input_validation(self):
        for invalid in ({"precio": "12.001"}, {"color": "red"}, {"nombre": "  "},
                        {"stock": -1}, {"modelo_3d": "robot"}):
            response = self.client.post(PREFIX + "/productos", headers=KEY, json=PRODUCT | invalid)
            self.assertEqual(response.status_code, 422, response.text)
        self.assertEqual(self.product()["nombre"], "Laptop")

    def test_sale_is_atomic_with_insufficient_stock(self):
        first, second = self.product(), self.product(stock=1)
        self.assertEqual(self.sale(uuid4(), [(first["id"], 2), (second["id"], 2)]).status_code, 409)
        self.assertEqual(self.client.get(PREFIX + "/ventas", headers=KEY).json(), [])
        self.assertEqual([p["stock"] for p in self.client.get(PREFIX + "/productos").json()], [5, 1])

    def test_normalized_cart_uses_server_prices_and_is_idempotent(self):
        first, second = self.product(), self.product(precio="1.05")
        order = uuid4()
        a, b = first["id"], second["id"]
        initial = self.sale(order, [(b, 1), (a, 1), (a, 2)])
        self.assertEqual(initial.status_code, 201, initial.text)
        self.assertEqual(Decimal(initial.json()["total"]), Decimal("38.10"))
        self.assertEqual([i["cantidad"] for i in initial.json()["items"]], [3, 1])
        self.assertEqual(self.sale(order, [(a, 3), (b, 1)]).json(), initial.json())
        self.assertEqual(self.sale(order, [(a, 2), (b, 1)]).status_code, 409)
        self.assertEqual([p["stock"] for p in self.client.get(PREFIX + "/productos").json()], [2, 4])

    def test_stale_product_edit_cannot_restore_stock_sold_after_form_opened(self):
        product = self.product()
        product_id = product["id"]
        self.assertEqual(self.sale(uuid4(), [(product_id, 1)]).status_code, 201)
        response = self.client.put(f"{PREFIX}/productos/{product_id}", headers=KEY,
                                   json=PRODUCT | {"expected_stock": product["stock"]})
        self.assertEqual(response.status_code, 409, response.text)
        self.assertEqual(self.client.get(PREFIX + "/productos").json()[0]["stock"], 4)

    def test_archive_preserves_sale_snapshot(self):
        product_id = self.product()["id"]
        self.assertEqual(self.sale(uuid4(), [(product_id, 1)]).status_code, 201)
        updated = self.client.put(f"{PREFIX}/productos/{product_id}", headers=KEY,
                                  json=PRODUCT | {"nombre": "Renombrado", "precio": "20",
                                                  "stock": 4, "expected_stock": 4})
        self.assertEqual(updated.status_code, 200, updated.text)
        self.assertEqual(self.client.delete(f"{PREFIX}/productos/{product_id}", headers=KEY).status_code, 204)
        self.assertEqual(self.client.get(PREFIX + "/productos").json(), [])
        [line] = self.client.get(PREFIX + "/ventas", headers=KEY).json()
        self.assertEqual(line["nombre_producto"], "Laptop")
        self.assertEqual(Decimal(line["precio_unitario"]), Decimal("12.35"))
        self.assertEqual(self.sale(uuid4(), [(product_id, 1)]).status_code, 409)
