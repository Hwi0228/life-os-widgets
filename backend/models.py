from pydantic import BaseModel
from typing import Optional, List

class QuestCreate(BaseModel):
    title: str
    category: Optional[str] = "MAIN"
    exp_reward: Optional[int] = 10

class QuestUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    exp_reward: Optional[int] = None
    completed: Optional[bool] = None

class QuestOut(BaseModel):
    id: int
    title: str
    category: str
    exp_reward: int
    completed: bool
    created_at: str

class MemoCreate(BaseModel):
    title: str = "NEW MEMO"
    content: str = ""
    color: str = "yellow"

class MemoUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    color: Optional[str] = None

class MemoOut(BaseModel):
    id: int
    title: str
    content: str
    color: str
    created_at: str

class LifeStatsUpdate(BaseModel):
    energy: Optional[int] = None
    focus: Optional[int] = None
    hydration: Optional[int] = None
    mood: Optional[int] = None

class WidgetLayoutUpdate(BaseModel):
    widget_id: str
    x: int
    y: int
    w: int
    h: int
    visible: bool
    z_index: int
