# DungeonCrawlerRPG
In-Progress Web based Dungeon Crawler


I installed lucide-react -  open-source icon library that provides 1600+ vector (svg) files for displaying icons and symbols in digital and non-digital projects. 
Can prob use some of the icons and symbols for our game like swords and health, etc or we can just do it without icons. 



Frontend

cd frontend
npm install
npm run dev

Backend

cd backend
python -m venv .venv
Bash Shell
source .venv/Scripts/activate
CMD/Powershell
.venv\Scripts\activate
pip install -r requirements.txt

uvicorn src.main:app --reload