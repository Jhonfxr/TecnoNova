# TecnoNova

Tienda de tecnología con catálogo, inventario, ventas de demostración y showroom 3D. El frontend usa React, Vite y Three.js. La API usa FastAPI y guarda los datos en Supabase.

- [Tienda publicada](https://tecno-nova-psi.vercel.app/)
- [Documentación de la API](https://tecnonova-api.onrender.com/docs)

## Recorrer la tienda

En **Showroom 3D** apareces en la entrada. Usa WASD o las flechas para caminar y arrastra el ratón para mirar. Apunta a un producto cercano y pulsa E para abrir su ficha. En el celular, usa los botones de dirección y arrastra para mirar. **Vista general** muestra el plano en perspectiva.

## Ejecutar en Windows

Configura backend/.env a partir de backend/.env.example. Para una base nueva, aplica database/schema.sql y luego database/seed.sql. En PowerShell, desde la raíz del repositorio:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8001
```

En otra terminal, desde la raíz:

```powershell
cd frontend
npm ci
npm run dev
```

Abre la dirección Local que imprima Vite. Para producción, el frontend usa VITE_API_URL y la API incluye el dominio público del frontend en CORS_ORIGINS.
