from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.models import QuestCreate, QuestUpdate

router = APIRouter(prefix="/api/quests", tags=["Quests (Todos)"])

@router.get("")
def get_quests():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, category, exp_reward, completed, created_at FROM quests ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
def create_quest(quest: QuestCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO quests (title, category, exp_reward, completed)
    VALUES (?, ?, ?, 0)
    """, (quest.title, quest.category, quest.exp_reward))
    quest_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": quest_id, "title": quest.title, "category": quest.category, "exp_reward": quest.exp_reward, "completed": False}

@router.put("/{quest_id}")
def update_quest(quest_id: int, quest: QuestUpdate):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, title, category, exp_reward, completed FROM quests WHERE id = ?", (quest_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Quest not found")

    current = dict(row)
    new_title = quest.title if quest.title is not None else current["title"]
    new_category = quest.category if quest.category is not None else current["category"]
    new_exp = quest.exp_reward if quest.exp_reward is not None else current["exp_reward"]
    new_completed = quest.completed if quest.completed is not None else bool(current["completed"])

    # If completed changed from False to True, award EXP!
    exp_gained = 0
    level_up = False
    new_level = 1
    new_total_exp = 0

    if not current["completed"] and new_completed:
        exp_gained = new_exp
        cursor.execute("SELECT level, exp FROM life_stats WHERE id = 1")
        stats = dict(cursor.fetchone())
        new_total_exp = stats["exp"] + exp_gained
        new_level = stats["level"]
        
        # 100 EXP per level
        if new_total_exp >= 100:
            level_up = True
            new_level += new_total_exp // 100
            new_total_exp = new_total_exp % 100

        cursor.execute("UPDATE life_stats SET level = ?, exp = ? WHERE id = 1", (new_level, new_total_exp))

    cursor.execute("""
    UPDATE quests
    SET title = ?, category = ?, exp_reward = ?, completed = ?
    WHERE id = ?
    """, (new_title, new_category, new_exp, 1 if new_completed else 0, quest_id))
    
    conn.commit()
    conn.close()

    return {
        "status": "updated",
        "quest": {"id": quest_id, "title": new_title, "category": new_category, "exp_reward": new_exp, "completed": new_completed},
        "exp_gained": exp_gained,
        "level_up": level_up,
        "new_level": new_level,
        "new_exp": new_total_exp
    }

@router.delete("/{quest_id}")
def delete_quest(quest_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM quests WHERE id = ?", (quest_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": quest_id}
