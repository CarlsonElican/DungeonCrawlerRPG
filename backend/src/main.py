# Ignore any missing import warnings in the backend for now
# The backend runs perfectly, it's just a local VS Code path quirk because our code lives in the /backend
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import psycopg
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Dungeon Crawler RPG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db_connection():
    url = os.getenv("DATABASE_URL")
    if not url:
        raise ValueError("DATABASE_URL is missing from your .env file!")
    return psycopg.connect(url)


@app.get("/")
def root():
    return {"message": "Dungeon Crawler Backend is Running!"}


@app.get("/api/game-status")
def get_game_status():
    """Example endpoint pulling live data from your Neon database"""
    try:
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT NOW();")
                db_time = cur.fetchone()

                return {
                    "status": "healthy",
                    "database": "Connected to Neon successfully!",
                    "server_time": db_time[0],
                }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Database connection failed: {str(e)}"
        )
