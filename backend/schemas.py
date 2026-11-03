from typing import Any
from pydantic import BaseModel, Field, ConfigDict

class ProfileCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)

class SimulationCreate(BaseModel):
    system: str = Field(min_length=1)
    scenario: str = Field(min_length=1)
    status: str = Field(min_length=1)
    duration: float | None = Field(default=None, ge=0)
    events_json: list[Any] = Field(default_factory=list)
    snapshot_json: dict[str, Any] = Field(default_factory=dict)

class AttemptCreate(BaseModel):
    payload: dict[str, Any] = Field(default_factory=dict)
