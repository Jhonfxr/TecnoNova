from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Sistema, Equipo, Escenario
from schemas import SistemaCreate, ElementoCreate

app = FastAPI(title="API DrillSim", version="1.0.0")

@app.get("/api/v1/sistemas", tags=["Sistemas"])
def listar_sistemas(db: Session = Depends(get_db)):
    return db.query(Sistema).order_by(Sistema.id).all()

@app.post("/api/v1/sistemas", status_code=201, tags=["Sistemas"])
def crear_sistema(datos: SistemaCreate, db: Session = Depends(get_db)):
    item = Sistema(**datos.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item

@app.get("/api/v1/equipos", tags=["Equipos"])
def listar_equipos(db: Session = Depends(get_db)):
    return db.query(Equipo).order_by(Equipo.id).all()

@app.post("/api/v1/equipos", status_code=201, tags=["Equipos"])
def crear_equipo(datos: ElementoCreate, db: Session = Depends(get_db)):
    if not db.get(Sistema, datos.sistema_id):
        raise HTTPException(404, "Sistema no encontrado")
    item = Equipo(**datos.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item

@app.get("/api/v1/escenarios", tags=["Escenarios"])
def listar_escenarios(db: Session = Depends(get_db)):
    return db.query(Escenario).order_by(Escenario.id).all()

@app.post("/api/v1/escenarios", status_code=201, tags=["Escenarios"])
def crear_escenario(datos: ElementoCreate, db: Session = Depends(get_db)):
    if not db.get(Sistema, datos.sistema_id):
        raise HTTPException(404, "Sistema no encontrado")
    item = Escenario(**datos.model_dump())
    db.add(item); db.commit(); db.refresh(item)
    return item
