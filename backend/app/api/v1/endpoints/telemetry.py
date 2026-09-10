from fastapi import APIRouter, Header, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.schemas.telemetry import ESP32TelemetryIn

router = APIRouter()

@router.post("/iot-ingest", status_code=201)
async def ingest_iot_probe(
    payload: ESP32TelemetryIn,
    x_device_signature: str = Header(default="dev-test-sig"),
    db: AsyncSession = Depends(get_db)
):
    """
    Ingests live capacitance soil moisture and piezometer pore-water pressure telemetry
    from ESP32 edge probes along highway corridors.
    """
    return {
        "status": "INGESTED",
        "sensor_id": payload.sensor_id,
        "corridor_id": payload.corridor_id,
        "pore_pressure_kpa": payload.pore_water_pressure_kpa
    }
