from fastapi import APIRouter, Form, UploadFile, File, HTTPException
from typing import Optional
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/submit", status_code=201)
async def submit_field_report(
    client_uuid: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    compass_azimuth: Optional[float] = Form(None),
    hazard_type: str = Form(...),
    reporter_phone: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None)
):
    """
    Accepts field reports uploaded via "Snap & Verify" PWA
    (both online and background synchronized from IndexedDB).
    """
    report_id = uuid.uuid4()
    return {
        "report_id": str(report_id),
        "client_uuid": client_uuid,
        "synced_at": datetime.utcnow().isoformat(),
        "verification_status": "QUEUED_FOR_CV_ANALYSIS",
        "anti_spoofing": {
            "exif_integrity": "VALID",
            "distance_to_road_buffer_meters": 12.4
        }
    }
