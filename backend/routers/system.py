from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.models import LifeStatsUpdate
import random

router = APIRouter(prefix="/api/system", tags=["System & Life Stats"])

@router.get("/stats")
def get_life_stats():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, level, exp, energy, focus, hydration, mood FROM life_stats WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    if not row:
        return {"level": 1, "exp": 0, "energy": 80, "focus": 90, "hydration": 70, "mood": 85}
    return dict(row)

@router.put("/stats")
def update_life_stats(stats: LifeStatsUpdate):
    conn = get_db()
    cursor = conn.cursor()
    
    current = get_life_stats()
    energy = stats.energy if stats.energy is not None else current["energy"]
    focus = stats.focus if stats.focus is not None else current["focus"]
    hydration = stats.hydration if stats.hydration is not None else current["hydration"]
    mood = stats.mood if stats.mood is not None else current["mood"]

    # Clamp 0-100
    energy = max(0, min(100, energy))
    focus = max(0, min(100, focus))
    hydration = max(0, min(100, hydration))
    mood = max(0, min(100, mood))

    cursor.execute("""
    UPDATE life_stats
    SET energy = ?, focus = ?, hydration = ?, mood = ?
    WHERE id = 1
    """, (energy, focus, hydration, mood))
    conn.commit()
    conn.close()

    return {"status": "success", "stats": {"energy": energy, "focus": focus, "hydration": hydration, "mood": mood}}

@router.get("/weather")
def get_retro_weather():
    weathers = [
        {"city": "PIXEL CITY", "temp": "22°C", "condition": "SUNNY ☀️", "icon": "sun", "humidity": "45%"},
        {"city": "NEON HARBOR", "temp": "18°C", "condition": "PIXEL RAIN 🌧️", "icon": "rain", "humidity": "85%"},
        {"city": "CYBER VALLEY", "temp": "25°C", "condition": "CLEAR SKY 🌌", "icon": "clear", "humidity": "50%"},
        {"city": "RETRO PEAK", "temp": "12°C", "condition": "8-BIT SNOW ❄️", "icon": "snow", "humidity": "70%"}
    ]
    return random.choice(weathers)
