import os
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.engine import make_url
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy.pool import StaticPool

load_dotenv(Path(__file__).with_name(".env"))


def build_engine():
    raw = os.getenv("DATABASE_URL")
    if not raw:
        return None
    try:
        url = make_url(raw)
        if url.drivername in {"postgres", "postgresql"}:
            url = url.set(drivername="postgresql+psycopg2")
        if url.get_backend_name() == "postgresql":
            url = url.update_query_dict({"sslmode": "require"})
            return create_engine(url, pool_pre_ping=True, hide_parameters=True,
                                 connect_args={"connect_timeout": 5},
                                 isolation_level="READ COMMITTED")
        if url.get_backend_name() == "sqlite":
            options = {"poolclass": StaticPool} if url.database in (None, "", ":memory:") else {}
            result = create_engine(url, pool_pre_ping=True,
                                   connect_args={"check_same_thread": False}, **options)

            @event.listens_for(result, "connect")
            def enable_foreign_keys(connection, _):
                connection.execute("PRAGMA foreign_keys=ON")

            return result
    except Exception:
        raise RuntimeError("DATABASE_URL no válida o controlador no disponible") from None
    raise RuntimeError("DATABASE_URL debe usar PostgreSQL o SQLite")


engine = build_engine()
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    from fastapi import HTTPException

    if engine is None:
        raise HTTPException(503, "Base de datos no configurada")
    with SessionLocal() as db:
        yield db
