# Backend TecnoNova

Usa Python 3.11 o superior. Desde la raíz del repositorio:

1. Ejecuta `database/schema.sql` y `database/seed.sql` en una transacción de PostgreSQL con las tablas aún sin crear. Por ejemplo: `psql "$env:DATABASE_URL" -v ON_ERROR_STOP=1 --single-transaction -f database/schema.sql -f database/seed.sql` en PowerShell. El esquema usa roles de Supabase (`anon` y `authenticated`).
2. Entra en `backend`, crea un entorno virtual con `python -m venv .venv` e instala `python -m pip install -r requirements.txt` desde el entorno.
3. Copia `.env.example` a `.env`. Configura `DATABASE_URL` con la conexión de PostgreSQL de un rol de servidor autorizado para administrar las tablas. La conexión usa SSL. Define una `ADMIN_API_KEY` privada y orígenes exactos de frontend en `CORS_ORIGINS`, separados por comas.
4. Inicia con `python -m uvicorn main:app --reload`. La documentación interactiva está en `http://127.0.0.1:8000/docs` y `GET /health` comprueba la conexión a la base.

El catálogo activo y las categorías se pueden consultar sin clave. Envía `X-Admin-Key` para administrar productos, consultar inactivos y operar ventas. La API devuelve los importes como cadenas decimales en bolivianos. Eliminar un producto lo archiva y conserva el historial.

Para registrar una venta, genera un UUID nuevo y envía únicamente el identificador del pedido y las cantidades por producto. Reutiliza el UUID si reintentas el mismo carrito tras un fallo de conexión. El servidor calcula el total a partir del precio vigente y conserva el precio histórico. Los duplicados de producto se suman, con un máximo de 1000 unidades por producto.

`SLACK_WEBHOOK_URL` es opcional. Si se configura, cada pedido nuevo confirmado programa una notificación en segundo plano. La entrega de la notificación no cambia el resultado de la venta.

Para probar desde `backend`, instala `python -m pip install -r requirements-dev.txt` y ejecuta `python -m unittest discover -s tests -v` o `python -m pytest`. Las pruebas crean su propio SQLite en memoria y desactivan el webhook.
