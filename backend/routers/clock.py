from fastapi import APIRouter
from datetime import datetime, timezone
import time

router = APIRouter(prefix="/api/clock", tags=["Clock & Pomodoro"])

@router.get("/time")
def get_server_time():
    now = datetime.now()
    return {
        "timestamp": int(time.time()),
        "iso": now.isoformat(),
        "time_str": now.strftime("%H:%M:%S"),
        "date_str": now.strftime("%Y-%m-%d (%a)")
    }
