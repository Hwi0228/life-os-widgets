from fastapi import APIRouter, HTTPException
from backend.database import get_db
from backend.models import MemoCreate, MemoUpdate

router = APIRouter(prefix="/api/memos", tags=["Memos"])

@router.get("")
def get_memos():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, content, color, created_at FROM memos ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("")
def create_memo(memo: MemoCreate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO memos (title, content, color)
    VALUES (?, ?, ?)
    """, (memo.title, memo.content, memo.color))
    memo_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return {"id": memo_id, "title": memo.title, "content": memo.content, "color": memo.color}

@router.put("/{memo_id}")
def update_memo(memo_id: int, memo: MemoUpdate):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, content, color FROM memos WHERE id = ?", (memo_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Memo not found")

    current = dict(row)
    title = memo.title if memo.title is not None else current["title"]
    content = memo.content if memo.content is not None else current["content"]
    color = memo.color if memo.color is not None else current["color"]

    cursor.execute("""
    UPDATE memos
    SET title = ?, content = ?, color = ?
    WHERE id = ?
    """, (title, content, color, memo_id))
    conn.commit()
    conn.close()
    return {"id": memo_id, "title": title, "content": content, "color": color}

@router.delete("/{memo_id}")
def delete_memo(memo_id: int):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM memos WHERE id = ?", (memo_id,))
    conn.commit()
    conn.close()
    return {"status": "deleted", "id": memo_id}
