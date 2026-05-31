# DungeonCrawlerRPG

An in-progress web-based dungeon crawler RPG.

## Notes

We installed `lucide-react`, an open-source icon library that provides 1600+ SVG icons for digital projects.

Possible uses for the game include:
- Swords and weapons
- Health and hearts
- Inventory icons
- UI buttons and status indicators

We can either use these icons throughout the project or keep the UI minimal without them.


# File Name Description

File that creates all tables with structure
- backend/database/schema.sql 

Sql file(s) needed to load all sample data into our database
- backend/database/populateTable

A sql file with all queries used in our application 
- backend/database/queries.sql

Stored procedures, include a file with all stored procedures
- Our application does not use any stored procedures

# Video Link

https://www.youtube.com/watch?v=UYRVCWKn8UQ

---

# Frontend

```
cd frontend
npm install
npm run dev
```

# Backend

```
cd backend

(DO THIS FIRST TIME ONLY, AFTERWARD DON'T NEED TO DO THIS)
python -m venv .venv
.venv\Scripts\activate or source .venv/bin/activate
pip install -r requirements.txt

(DO THIS TO RUN THE SERVER)
uvicorn src.main:app --reload

Run when you install new Python packages, so dependencies are consistent
pip freeze > requirements.txt
```

# Database

database info is in .env backend for url

psql 'link' in command prompt 

