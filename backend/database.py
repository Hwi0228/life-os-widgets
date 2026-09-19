import sqlite3
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(exist_ok=True)
DB_PATH = DATA_DIR / "life_os.db"

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Quests (Todos) Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT DEFAULT 'MAIN',
        exp_reward INTEGER DEFAULT 10,
        completed INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Sticky Memos Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT DEFAULT 'NEW MEMO',
        content TEXT DEFAULT '',
        color TEXT DEFAULT 'yellow',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # Life Stats & Player Status Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS life_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        level INTEGER DEFAULT 1,
        exp INTEGER DEFAULT 0,
        energy INTEGER DEFAULT 80,
        focus INTEGER DEFAULT 90,
        hydration INTEGER DEFAULT 70,
        mood INTEGER DEFAULT 85
    )
    """)

    # Seed initial life stats if not exists
    cursor.execute("SELECT COUNT(*) FROM life_stats")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
        INSERT INTO life_stats (id, level, exp, energy, focus, hydration, mood)
        VALUES (1, 1, 0, 80, 90, 70, 85)
        """)

    # Widget Layout Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS widget_layouts (
        widget_id TEXT PRIMARY KEY,
        x INTEGER DEFAULT 100,
        y INTEGER DEFAULT 100,
        w INTEGER DEFAULT 320,
        h INTEGER DEFAULT 240,
        visible INTEGER DEFAULT 1,
        z_index INTEGER DEFAULT 10
    )
    """)

    # Seed initial quests if table is empty
    cursor.execute("SELECT COUNT(*) FROM quests")
    if cursor.fetchone()[0] == 0:
        initial_quests = [
            ("⚔️ Complete Life OS Initial Setup", "MAIN", 50, 1),
            ("☕ Drink a cup of fresh pixel coffee", "DAILY", 15, 0),
            ("💻 Code awesome mini widgets", "MAIN", 30, 0),
            ("🧘 5-minute Retro Chill Meditation", "REST", 20, 0)
        ]
        cursor.executemany("""
        INSERT INTO quests (title, category, exp_reward, completed)
        VALUES (?, ?, ?, ?)
        """, initial_quests)

    # Seed initial memos if empty
    cursor.execute("SELECT COUNT(*) FROM memos")
    if cursor.fetchone()[0] == 0:
        initial_memos = [
            ("👾 WELCOME TO LIFE OS", "Welcome to your 8-bit desktop! Drag windows around, customize your status, and level up by finishing quests!", "yellow"),
            ("💡 TEAM NOTE", "AI Team: Gemini (Turn 1), ChatGPT (Turn 2), Claude (Turn 3), Grok (Turn 4). Enjoy building!", "green")
        ]
        cursor.executemany("""
        INSERT INTO memos (title, content, color)
        VALUES (?, ?, ?)
        """, initial_memos)

    conn.commit()
    conn.close()

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully.")
