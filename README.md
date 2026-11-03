# Backend de DrillSim

API para perfiles, simulaciones y registros complementarios de DrillSim. Usa FastAPI y las tablas PostgreSQL del proyecto DrillSim en Supabase. La API transmite el token del usuario a Supabase para aplicar las reglas de seguridad por filas.

## Ejecutar en Windows

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

En `.env`, configurar la URL y la clave publicable del proyecto desde Supabase. No usar la clave secreta ni subir el archivo `.env` a GitHub.

```powershell
.\venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

Abrir http://127.0.0.1:8000/docs. Los endpoints requieren un token de acceso de un usuario de Supabase Auth: selecciona **Authorize** y pega el token. Crear primero la cuenta en Auth y luego su perfil con `POST /api/v1/users/me`. Después se pueden registrar y consultar simulaciones e intentos con sus rutas GET y POST.

La autenticación y el almacenamiento están vinculados a cada usuario; la API no guarda contraseñas. El proyecto original de DrillSim utiliza SQLite local: esta API es una adaptación independiente para la tarea.
