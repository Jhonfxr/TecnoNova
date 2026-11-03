# Backend de DrillSim

API para consultar y registrar sistemas, equipos y escenarios del simulador. Está desarrollada con FastAPI, SQLAlchemy y PostgreSQL en Supabase.

## Tablas

- `sistemas`: nombre y descripción de cada sistema de perforación.
- `equipos`: nombre, descripción y sistema al que pertenece cada equipo.
- `escenarios`: nombre, descripción y sistema al que corresponde cada práctica.

## Instalación en Windows

```powershell
cd backend
python -m venv venv
.\venv\Scripts\python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

En Supabase, abrir el proyecto DrillSim y copiar la conexión **Session pooler** desde Connect. Colocarla en `.env` después de `DATABASE_URL=` y reemplazar el marcador de contraseña. Codificar los caracteres especiales de la contraseña en la URL; por ejemplo, `@` es `%40`. No subir `.env` a GitHub.

```powershell
.\venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

Abrir http://127.0.0.1:8000/docs. Cada tabla tiene rutas GET y POST. Crear primero un sistema; usar el `id` obtenido como `sistema_id` al crear un equipo o escenario.

Ejemplos: un sistema llamado Circulación, un equipo llamado Bomba de lodo y un escenario llamado Obstrucción de broca.

La API es para práctica local y sus rutas POST no tienen autenticación. Antes de publicarla, implementar autenticación y autorización: una conexión de PostgreSQL privilegiada puede eludir RLS. El simulador original usa SQLite local; esta API es una adaptación independiente.
