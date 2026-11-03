from sqlalchemy import BigInteger, Column, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from database import Base
class Sistema(Base):
    __tablename__ = "sistemas"
    id = Column(BigInteger, primary_key=True)
    nombre = Column(Text, nullable=False)
    descripcion = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
class Equipo(Base):
    __tablename__ = "equipos"
    id = Column(BigInteger, primary_key=True)
    sistema_id = Column(BigInteger, ForeignKey("sistemas.id"), nullable=False)
    nombre = Column(Text, nullable=False)
    descripcion = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
class Escenario(Base):
    __tablename__ = "escenarios"
    id = Column(BigInteger, primary_key=True)
    sistema_id = Column(BigInteger, ForeignKey("sistemas.id"), nullable=False)
    nombre = Column(Text, nullable=False)
    descripcion = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
