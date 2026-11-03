import os
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from schemas import ProfileCreate, SimulationCreate, AttemptCreate

load_dotenv()
URL = os.getenv("SUPABASE_URL", "").rstrip("/")
KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
app = FastAPI(title="API DrillSim", version="1.0.0")
bearer = HTTPBearer(auto_error=False)

async def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not URL or not KEY:
        raise HTTPException(503, "Configuración de Supabase incompleta")
    if not credentials:
        raise HTTPException(401, "Se necesita un token de Supabase Auth")
    headers = {"apikey": KEY, "Authorization": f"Bearer {credentials.credentials}"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(f"{URL}/auth/v1/user", headers=headers)
    except httpx.HTTPError:
        raise HTTPException(502, "No se pudo conectar con Supabase")
    if response.status_code != 200:
        raise HTTPException(401, "Sesión no válida o vencida")
    user = response.json()
    return user, headers

async def request_db(table: str, method: str, headers: dict, data=None, params=None):
    headers = {**headers, "Prefer": "return=representation"}
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.request(method, f"{URL}/rest/v1/{table}", headers=headers, json=data, params=params)
    except httpx.HTTPError:
        raise HTTPException(502, "No se pudo conectar con Supabase")
    if r.status_code >= 400:
        if r.status_code == 409:
            raise HTTPException(409, "El registro ya existe o incumple una relación")
        raise HTTPException(502, "La base de datos rechazó la solicitud")
    return r.json()

@app.get("/api/v1/users/me", tags=["Usuarios"])
async def get_profile(auth=Depends(current_user)):
    user, headers = auth
    rows = await request_db("users", "GET", headers, params={"id": "eq." + user["id"], "select": "*"})
    if not rows: raise HTTPException(404, "Perfil no encontrado")
    return rows[0]

@app.post("/api/v1/users/me", status_code=status.HTTP_201_CREATED, tags=["Usuarios"])
async def create_profile(body: ProfileCreate, auth=Depends(current_user)):
    user, headers = auth
    if not user.get("email"): raise HTTPException(400, "La cuenta requiere correo")
    rows = await request_db("users", "POST", headers, {"id": user["id"], "email": user["email"], "name": body.name})
    return rows[0]

@app.get("/api/v1/simulations", tags=["Simulaciones"])
async def list_simulations(auth=Depends(current_user)):
    user, headers = auth
    return await request_db("simulations", "GET", headers, params={"user_id": "eq." + user["id"], "select": "*", "order": "created_at.desc"})

@app.post("/api/v1/simulations", status_code=201, tags=["Simulaciones"])
async def create_simulation(body: SimulationCreate, auth=Depends(current_user)):
    user, headers = auth
    rows = await request_db("simulations", "POST", headers, {**body.model_dump(), "user_id": user["id"]})
    return rows[0]

@app.get("/api/v1/attempts", tags=["Intentos"])
async def list_attempts(auth=Depends(current_user)):
    user, headers = auth
    return await request_db("attempts", "GET", headers, params={"user_id": "eq." + user["id"], "select": "*", "order": "created_at.desc"})

@app.post("/api/v1/attempts", status_code=201, tags=["Intentos"])
async def create_attempt(body: AttemptCreate, auth=Depends(current_user)):
    user, headers = auth
    rows = await request_db("attempts", "POST", headers, {**body.model_dump(), "user_id": user["id"]})
    return rows[0]
