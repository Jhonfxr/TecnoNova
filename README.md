# TecnoNova

TecnoNova es una tienda de tecnología con catálogo, showroom 3D, inventario y ventas de demostración. Es mi proyecto final del módulo Tecnologías Informáticas del Diplomado en Desarrollo de Software de la UDABOL.

- [Tienda publicada](https://tecno-nova-psi.vercel.app/)
- [Documentación de la API](https://tecnonova-api.onrender.com/docs)

## Recorrer la tienda

En **Showroom 3D** apareces en la entrada. El pasillo central conecta cuatro secciones con exhibidores iluminados: Computación, Móviles, Audio y Accesorios. Usa WASD o las flechas para caminar y arrastra el ratón para mirar. El minimapa indica tu posición. Apunta a un producto cercano y pulsa E para abrir su ficha. En el celular, usa los controles táctiles. **Vista general** muestra la distribución completa de la tienda.

Puedes consultar el precio y las existencias desde la ficha de cada producto o desde el catálogo con filtros. El carrito calcula el total de un pedido de demostración. Para registrar una venta hace falta la clave del encargado.

## Cómo está hecho

- **Frontend** con React, Vite y Three.js mediante React Three Fiber, publicado en Vercel.
- **API REST** con FastAPI y SQLAlchemy, alojada en Render y documentada con Swagger UI.
- **Base de datos** PostgreSQL en Supabase, con las tablas `categorias`, `productos` y `ventas`.
- **Desarrollo** con apoyo de Codex para escribir y revisar código, ajustar el showroom y probar la aplicación.

Al confirmar un pedido, la API valida las existencias, registra la venta y actualiza el stock en una sola transacción.

## Ejecutar en Windows

Necesitas Python y una versión de Node.js compatible con Vite (20.19 o posterior dentro de la rama 20, o 22.12 en adelante). Para una base nueva, ejecuta [el esquema](database/schema.sql) y luego [los datos de ejemplo](database/seed.sql) en Supabase. Copia [`backend/.env.example`](backend/.env.example) a `backend/.env` y configura `DATABASE_URL` y `ADMIN_API_KEY`.

Abre PowerShell en la raíz del repositorio e inicia la API.

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

En otra terminal, desde la raíz, inicia el frontend.

```powershell
cd frontend
npm ci
npm run dev
```

Abre la dirección local que muestra Vite. Para desplegar tu propia instancia, configura `VITE_API_URL` en Vercel y añade el dominio del frontend a `CORS_ORIGINS` en Render. Guarda la cadena de conexión y la clave del encargado en las variables privadas del backend.
