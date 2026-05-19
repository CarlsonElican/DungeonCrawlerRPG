# Ignore any missing import warnings in the backend for now
# The backend runs perfectly, it's just a local VS Code path quirk because our code lives in the /backend
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.database import get_db

app = FastAPI(title="Dungeon Crawler RPG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Dungeon Crawler Backend is Running!"}


@app.get("/api/game-status")
def get_game_status():
    """Verifies connection and pulls the complete list of active RPG tables"""
    try:
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT NOW();")
                db_time = cur.fetchone()[0]

                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public'
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name ASC;
                """)

                all_tables = [row[0] for row in cur.fetchall()]

                is_schema_populated = len(all_tables) > 0

                return {
                    "status": "healthy",
                    "database": "Connected to Neon successfully!",
                    "database_name": "rpg_game",
                    "server_time": db_time,
                    "total_tables_count": len(all_tables),
                    "verified_tables_found": all_tables,
                    "schema_ready": is_schema_populated,
                    "message": (
                        "🔥 Ready to build! Connection live and all tables verified."
                        if is_schema_populated
                        else "Connected, but no tables found."
                    ),
                }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database verification failed: {str(e)}"
        )
