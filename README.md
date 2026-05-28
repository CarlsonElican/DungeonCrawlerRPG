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

(First-Time Only)
python -m venv .venv
.venv\Scripts\activate or source .venv/bin/activate
pip install -r requirements.txt

Run run the backend server
uvicorn src.main:app --reload

Run when you install new Python packages, so dependencies are consistent
pip freeze > requirements.txt
```

Database

\c rpg_game to get into Database

\d to see all the tables 