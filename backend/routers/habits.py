from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
import os

from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.models import HabitCreate, HabitToggle, HabitUpdate

router = APIRouter(prefix="/api/habits", tags=["Habits & Streaks"])

TIMEZONE = ZoneInfo(os.getenv("LIFE_OS_TIMEZONE", "Asia/Seoul"))


def today_local() -> date:
    return datetime.now(TIMEZONE).date()


def _habit_snapshot(cursor, habit_id: int, today: date) -> dict:
    cursor.execute(
        "SELECT id, name, emoji, archived, created_at FROM habits WHERE id = ?",
        (habit_id,),
    )
    row = cursor.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Habit not found")

    habit = dict(row)
    cursor.execute(
        "SELECT completed_on FROM habit_logs WHERE habit_id = ? ORDER BY completed_on",
        (habit_id,),
    )
    completed_dates = {date.fromisoformat(r["completed_on"]) for r in cursor.fetchall()}

    current_streak = 0
    cursor_day = today
    while cursor_day in completed_dates:
        current_streak += 1
        cursor_day -= timedelta(days=1)

    best_streak = 0
    run = 0
    previous = None
    for completed_day in sorted(completed_dates):
        if previous is not None and completed_day == previous + timedelta(days=1):
            run += 1
        else:
            run = 1
        best_streak = max(best_streak, run)
        previous = completed_day

    last_7 = [
        {
            "date": (today - timedelta(days=offset)).isoformat(),
            "completed": (today - timedelta(days=offset)) in completed_dates,
        }
        for offset in range(6, -1, -1)
    ]
    completed_7d = sum(item["completed"] for item in last_7)

    return {
        "id": habit["id"],
        "name": habit["name"],
        "emoji": habit["emoji"],
        "archived": bool(habit["archived"]),
        "created_at": habit["created_at"],
        "completed_today": today in completed_dates,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "completion_rate_7d": round(completed_7d / 7 * 100, 1),
        "last_7": last_7,
    }


@router.get("")
def get_habits():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM habits WHERE archived = 0 ORDER BY id DESC")
    ids = [row["id"] for row in cursor.fetchall()]
    current_date = today_local()
    habits = [_habit_snapshot(cursor, habit_id, current_date) for habit_id in ids]
    conn.close()

    completed_today = sum(habit["completed_today"] for habit in habits)
    return {
        "habits": habits,
        "summary": {
            "completed_today": completed_today,
            "total_today": len(habits),
            "completion_percent": round(
                (completed_today / len(habits) * 100) if habits else 0,
                1,
            ),
            "best_streak": max((habit["best_streak"] for habit in habits), default=0),
        },
    }


@router.post("")
def create_habit(habit: HabitCreate):
    name = habit.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Habit name cannot be empty")
    emoji = habit.emoji.strip() or "✅"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO habits (name, emoji) VALUES (?, ?)",
        (name, emoji),
    )
    habit_id = cursor.lastrowid
    conn.commit()
    snapshot = _habit_snapshot(cursor, habit_id, today_local())
    conn.close()
    return snapshot


@router.put("/{habit_id}/today")
def set_today(habit_id: int, payload: HabitToggle):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM habits WHERE id = ? AND archived = 0", (habit_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Habit not found")

    current_date = today_local().isoformat()
    if payload.completed:
        cursor.execute(
            """
            INSERT OR IGNORE INTO habit_logs (habit_id, completed_on)
            VALUES (?, ?)
            """,
            (habit_id, current_date),
        )
    else:
        cursor.execute(
            "DELETE FROM habit_logs WHERE habit_id = ? AND completed_on = ?",
            (habit_id, current_date),
        )

    conn.commit()
    snapshot = _habit_snapshot(cursor, habit_id, date.fromisoformat(current_date))
    conn.close()
    return snapshot


@router.put("/{habit_id}")
def update_habit(habit_id: int, payload: HabitUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, emoji, archived FROM habits WHERE id = ?",
        (habit_id,),
    )
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Habit not found")

    current = dict(row)
    name = payload.name.strip() if payload.name is not None else current["name"]
    emoji = payload.emoji.strip() if payload.emoji is not None else current["emoji"]
    archived = payload.archived if payload.archived is not None else bool(current["archived"])

    if not name:
        conn.close()
        raise HTTPException(status_code=422, detail="Habit name cannot be empty")
    if not emoji:
        emoji = "✅"

    cursor.execute(
        """
        UPDATE habits
        SET name = ?, emoji = ?, archived = ?
        WHERE id = ?
        """,
        (name, emoji, 1 if archived else 0, habit_id),
    )
    conn.commit()

    if archived:
        result = {
            "id": habit_id,
            "name": name,
            "emoji": emoji,
            "archived": True,
        }
    else:
        result = _habit_snapshot(cursor, habit_id, today_local())

    conn.close()
    return result


@router.delete("/{habit_id}")
def delete_habit(habit_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM habits WHERE id = ?", (habit_id,))
    if not cursor.fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Habit not found")

    cursor.execute("DELETE FROM habit_logs WHERE habit_id = ?", (habit_id,))
    cursor.execute("DELETE FROM habits WHERE id = ?", (habit_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": habit_id}
