from fastapi import APIRouter
from backend.database import get_db
from backend.models import WidgetLayoutUpdate
from typing import List

router = APIRouter(prefix="/api/layout", tags=["Widget Layout"])

@router.get("")
def get_widget_layouts():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT widget_id, x, y, w, h, visible, z_index FROM widget_layouts")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
def save_widget_layouts(layouts: List[WidgetLayoutUpdate]):
    conn = get_db()
    cursor = conn.cursor()
    for item in layouts:
        cursor.execute("""
        INSERT INTO widget_layouts (widget_id, x, y, w, h, visible, z_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(widget_id) DO UPDATE SET
            x=excluded.x,
            y=excluded.y,
            w=excluded.w,
            h=excluded.h,
            visible=excluded.visible,
            z_index=excluded.z_index
        """, (item.widget_id, item.x, item.y, item.w, item.h, 1 if item.visible else 0, item.z_index))
    conn.commit()
    conn.close()
    return {"status": "saved", "count": len(layouts)}
