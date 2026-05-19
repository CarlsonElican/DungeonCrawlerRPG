# backend/src/database.py
import os
import psycopg
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("CRITICAL ERROR: DATABASE_URL is missing from your .env file!")


class DatabaseConnection:
    """A clean Context Manager class to handle opening and closing connections safely."""

    def __init__(self):
        self.connection = None

    def __enter__(self):
        self.connection = psycopg.connect(DATABASE_URL)
        return self.connection

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.connection:
            self.connection.close()


def get_db():
    """Returns the context manager instance"""
    return DatabaseConnection()
