import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

from backend.database import init_db
from backend.routers import system, todos, notes, clock, layout, habits

BASE_DIR = Path(__file__).resolve().parent

# Initialize DB
init_db()

app = FastAPI(
    title="Life OS Dashboard API",
    description="Backend API for Modern Life OS Dashboard Web App",
    version="1.0.0"
)

# Include API Routers
app.include_router(system.router)
app.include_router(todos.router)
app.include_router(notes.router)
app.include_router(clock.router)
app.include_router(layout.router)
app.include_router(habits.router)

# Mount static files
static_dir = BASE_DIR / "static"
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def read_root():
    return FileResponse(static_dir / "index.html")

if __name__ == "__main__":
    print("[Life OS] Starting Life OS Server on http://localhost:8000 ...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
