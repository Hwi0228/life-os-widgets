# 🕹️ Retro Pixel "Life OS" Dashboard

A modular, 8-bit/16-bit pixel-art styled **Life OS Dashboard** web application. Built with a **Python (FastAPI)** backend and a retro pixel-art frontend.

Unlike a single-purpose app, Life OS is a **multi-widget dashboard** where users can track quests (todos), manage focus time, stick memo notes, monitor life status stats (HP/Energy/Focus/Mood), and customize widget layouts on a retro OS desktop screen.

---

## 🤖 AI Team Collaboration Protocol

This repository is built sequentially by an AI Team:
1. **Gemini** (Turn 1 - *Current*): Project setup, Core Dashboard Shell, Drag/Toggle system, CRT FX, Base Widgets (Clock/Pomodoro, RPG Quest Log, Sticky Memos, Life Stats Gauge).
2. **ChatGPT** (Turn 2 - *Current*): Daily Habit & Streak Tracker with persistent completion history.
3. **Claude** (Turn 3): Next feature implementation.
4. **Grok** (Turn 4): Next feature implementation.

### 📜 Commit Guidelines
- Commit under Git Username: `Hwi0228`
- Always add `Co-authored-by` in the commit message body:
  ```text
  feat: <short description of feature>

  Co-authored-by: Gemini <gemini@ai.team>
  ```
  *(Replace `Gemini` with `ChatGPT`, `Claude`, or `Grok` in subsequent turns)*

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- `fastapi`, `uvicorn`, `pydantic` (Pre-installed or install via `pip install fastapi uvicorn pydantic`)
- Optional: `LIFE_OS_TIMEZONE` environment variable (defaults to `Asia/Seoul`) for daily habit boundaries.

### Running the Application
```bash
# Run server directly from project root
python main.py
```
Open your browser and navigate to: **`http://localhost:8000`**

---

## 🧩 Architecture & Project Structure

```text
widgets/
├── main.py                     # FastAPI application entry point
├── backend/
│   ├── database.py             # Lightweight SQLite database manager
│   ├── models.py               # Pydantic data schemas
│   └── routers/
│       ├── system.py           # Life OS Status & Stats API
│       ├── todos.py            # RPG Quest Log API (EXP/Level system)
│       ├── notes.py            # Pixel Sticky Notes API
│       ├── clock.py            # Pomodoro Timer & World Clock API
│       └── layout.py           # Dashboard Widget Registry & Positioning API
└── static/
    ├── index.html              # Main Life OS Retro Desktop UI
    ├── css/
    │   └── retro_theme.css     # Pixel font styles, CRT scanlines, NES UI theme
    └── js/
        ├── app.js              # Core Life OS Engine (Widget Manager, Layout, Sound FX)
        └── widgets/
            ├── clock_widget.js # Pomodoro & Clock Widget
            ├── quest_widget.js # RPG Quest Log Widget
            ├── memo_widget.js  # Pixel Sticky Notes Widget
            ├── stats_widget.js # Life Status HP/MP Gauges Widget
            └── habit_widget.js # Daily Habit & Streak Tracker Widget
```

---

## 🛠️ How to Add a New Widget (For Teammates: ChatGPT, Claude, Grok)

Adding a new widget to Life OS is straightforward:

1. **Backend Route**:
   Add a router in `backend/routers/<your_widget>.py` and include it in `main.py`:
   ```python
   from fastapi import APIRouter
   router = APIRouter(prefix="/api/your_widget", tags=["Your Widget"])
   ```

2. **Frontend Widget**:
   Create a script `static/js/widgets/<your_widget>.js` and instantiate it via `LifeOS.registerWidget`:
   ```javascript
   LifeOS.registerWidget({
     id: "your_widget_id",
     title: "🎮 YOUR WIDGET TITLE",
     defaultPos: { x: 50, y: 50, w: 340, h: 260 },
     renderContent: function(container) { ... }
   });
   ```

3. **Include Script in HTML**:
   Add `<script src="/static/js/widgets/<your_widget>.js"></script>` in `static/index.html`.

---

## 🌟 Features Implemented by Gemini (Turn 1)
- 🎮 **Retro CRT & Theme Switcher**: Scanlines toggle, CRT phosphor glow effect, and retro wallpaper switcher.
- 🕒 **Pixel Clock & Pomodoro Widget**: Digital retro clock with interactive focus timer and sound feedback.
- ⚔️ **RPG Quest Log Widget**: Transform tasks into Quests with EXP rewards and Level-Up system.
- 📌 **Pixel Sticky Notes Widget**: Interactive color-coded mini memo pads.
- 📊 **Life Status Gauge Widget**: Energy, Focus, Hydration, and Mood stats with 8-bit health bars.

## 🌟 Features Implemented by ChatGPT (Turn 2)
- ✅ **Habit & Streak Tracker**: Create daily habits, persist completion history in SQLite, see today's completion ratio, 7-day completion rate, current streaks, and best streaks.
- 🕹️ **Layout Compatibility for New Widgets**: Previously saved layouts now automatically open newly registered widgets, so new team features appear after an upgrade without resetting existing widget positions.
- ⚙️ **Dynamic Widget Layout**: Drag windows across desktop, minimize/maximize/close widgets, and persistent layout saving.
