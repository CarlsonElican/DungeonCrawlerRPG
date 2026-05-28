# Ignore any missing import warnings in the backend for now
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from src.database import get_db
from src.schemas import (
    CharacterCreate,
    CharacterResponse,
    GameRunResponse,
    EventCompletionRequest,
    InventoryItemResponse,
    EquipItemRequest,
    ShopOfferResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from src.config import EVENT_TO_ENEMY_MAP
from src.dependencies import get_current_user, pwd_context, create_access_token
from src.routes.combat import router as combat_router
from typing import List

app = FastAPI(title="Dungeon Crawler RPG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Enforce the /api prefix here for routed endpoints to mirror frontend layout configuration rules
app.include_router(combat_router, prefix="/api/combat", tags=["Combat"])


@app.get("/")
def root():
    return {"message": "Dungeon Crawler Backend is Running!"}


# --- API ENDPOINTS ---


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


@app.get("/api/characters/me", response_model=List[CharacterResponse])
def get_my_characters(current_user: dict = Depends(get_current_user)):
    """Fetches all characters owned by a user"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    c.*,
                    c.base_hp + COALESCE(SUM(it.base_hp + ii.random_hp), 0) AS total_hp,
                    c.base_atk + COALESCE(SUM(it.base_atk + ii.random_atk), 0) AS total_atk,
                    c.base_def + COALESCE(SUM(it.base_def + ii.random_def), 0) AS total_def,
                    c.base_spd + COALESCE(SUM(it.base_spd + ii.random_spd), 0) AS total_spd,
                    c.base_eva + COALESCE(SUM(it.base_eva), 0) AS total_eva,
                    c.base_crit_rate + COALESCE(SUM(it.base_crit_rate), 0) AS total_crit_rate,
                    c.base_crit_dmg + COALESCE(SUM(it.base_crit_dmg), 0) AS total_crit_dmg,
                    c.base_lifesteal + COALESCE(SUM(it.base_lifesteal), 0) AS total_lifesteal
                FROM characters c
                LEFT JOIN inventory_items ii ON c.character_id = ii.character_id AND ii.is_equipped = TRUE
                LEFT JOIN item_templates it ON ii.item_template_id = it.item_template_id
                WHERE c.user_id = %s
                GROUP BY c.character_id;
            """,
                (current_user["user_id"],),
            )
            return cur.fetchall()


@app.post("/api/characters/create", response_model=CharacterResponse)
def create_character(
    char_data: CharacterCreate, current_user: dict = Depends(get_current_user)
):
    """Creates a new character and initializes their base stats"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO characters (user_id, name, base_hp, current_hp, base_atk, base_def, base_spd, 
                                        base_eva, base_crit_rate, base_crit_dmg, base_lifesteal, starter_skill)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *;
            """,
                (
                    current_user["user_id"],
                    char_data.name,
                    char_data.base_hp,
                    char_data.base_hp,
                    char_data.base_atk,
                    char_data.base_def,
                    char_data.base_spd,
                    char_data.base_eva,
                    char_data.base_crit_rate,
                    char_data.base_crit_dmg,
                    char_data.base_lifesteal,
                    char_data.starter_skill,
                ),
            )

            new_char = cur.fetchone()
            new_char["total_hp"] = new_char["base_hp"]
            new_char["total_atk"] = new_char["base_atk"]
            new_char["total_def"] = new_char["base_def"]
            new_char["total_spd"] = new_char["base_spd"]
            new_char["total_eva"] = new_char["base_eva"]
            new_char["total_crit_rate"] = new_char["base_crit_rate"]
            new_char["total_crit_dmg"] = new_char["base_crit_dmg"]
            new_char["total_lifesteal"] = new_char["base_lifesteal"]
            return new_char


@app.get("/api/characters/{character_id}", response_model=CharacterResponse)
def get_character_sheet(character_id: int):
    """Fetches a character's dynamic stats (Base + Equipped Items)"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    c.*,
                    c.base_hp + COALESCE(SUM(it.base_hp + ii.random_hp), 0) AS total_hp,
                    c.base_atk + COALESCE(SUM(it.base_atk + ii.random_atk), 0) AS total_atk,
                    c.base_def + COALESCE(SUM(it.base_def + ii.random_def), 0) AS total_def,
                    c.base_spd + COALESCE(SUM(it.base_spd + ii.random_spd), 0) AS total_spd,
                    c.base_eva + COALESCE(SUM(it.base_eva), 0) AS total_eva,
                    c.base_crit_rate + COALESCE(SUM(it.base_crit_rate), 0) AS total_crit_rate,
                    c.base_crit_dmg + COALESCE(SUM(it.base_crit_dmg), 0) AS total_crit_dmg,
                    c.base_lifesteal + COALESCE(SUM(it.base_lifesteal), 0) AS total_lifesteal
                FROM characters c
                LEFT JOIN inventory_items ii ON c.character_id = ii.character_id AND ii.is_equipped = TRUE
                LEFT JOIN item_templates it ON ii.item_template_id = it.item_template_id
                WHERE c.character_id = %s
                GROUP BY c.character_id;
            """,
                (character_id,),
            )
            char = cur.fetchone()
            if not char:
                raise HTTPException(status_code=404, detail="Character not found")
            return char


@app.post("/api/runs/start/{character_id}", response_model=GameRunResponse)
def start_run(character_id: int):
    """Initializes a new dungeon run session"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE game_runs SET ended_at = NOW() WHERE character_id = %s AND ended_at IS NULL",
                (character_id,),
            )

            cur.execute(
                """
                INSERT INTO game_runs (character_id, current_day, current_floor, current_room)
                VALUES (%s, 1, 1, 1)
                RETURNING *;
            """,
                (character_id,),
            )
            return cur.fetchone()


@app.get("/api/runs/active/{character_id}", response_model=GameRunResponse)
def get_active_run(character_id: int):
    """Retrieves the current ongoing run for a character"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM game_runs 
                WHERE character_id = %s AND ended_at IS NULL 
                ORDER BY last_played_at DESC LIMIT 1;
            """,
                (character_id,),
            )
            run = cur.fetchone()
            if not run:
                raise HTTPException(status_code=404, detail="No active run found")
            return run


@app.post("/api/runs/{run_id}/complete-event")
def complete_event(run_id: int, request: EventCompletionRequest):
    """Records event completion and advances the room counter"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT character_id, current_floor, current_room FROM game_runs WHERE run_id = %s",
                (run_id,),
            )
            run = cur.fetchone()
            if not run:
                raise HTTPException(status_code=404, detail="Run not found")

            cur.execute(
                "SELECT * FROM event_results WHERE event_result_id = %s",
                (request.event_result_id,),
            )
            er = cur.fetchone()

            cur.execute(
                """
                INSERT INTO run_events (run_id, event_template_id, event_result_id, floor_number, room_number)
                VALUES (%s, %s, %s, %s, %s)
            """,
                (
                    run_id,
                    request.event_template_id,
                    request.event_result_id,
                    run["current_floor"],
                    run["current_room"],
                ),
            )

            cur.execute(
                """
                UPDATE characters
                SET 
                    level = CASE WHEN (experience + %s) >= exp_cap THEN level + 1 ELSE level END,
                    base_hp = CASE WHEN (experience + %s) >= exp_cap THEN base_hp + 15 ELSE base_hp END,
                    base_atk = CASE WHEN (experience + %s) >= exp_cap THEN base_atk + 3 ELSE base_atk END,
                    base_def = CASE WHEN (experience + %s) >= exp_cap THEN base_def + 2 ELSE base_def END,
                    current_hp = LEAST(base_hp, current_hp + %s),
                    current_gold = GREATEST(0, current_gold + %s),
                    experience = CASE WHEN (experience + %s) >= exp_cap 
                                      THEN (experience + %s) - exp_cap 
                                      ELSE experience + %s END,
                    exp_cap = CASE WHEN (experience + %s) >= exp_cap 
                                   THEN ROUND(exp_cap * 1.5) 
                                   ELSE exp_cap END,
                    updated_at = CURRENT_TIMESTAMP,
                    highest_floor_reached = GREATEST(highest_floor_reached, %s)
                WHERE character_id = %s;
            """,
                (
                    er["exp_change"],
                    er["exp_change"],
                    er["exp_change"],
                    er["exp_change"],
                    er["hp_change"],
                    er["gold_change"],
                    er["exp_change"],
                    er["exp_change"],
                    er["exp_change"],
                    er["exp_change"],
                    run["current_floor"],
                    run["character_id"],
                ),
            )

            cur.execute(
                """
                UPDATE game_runs 
                SET current_room = current_room + 1, 
                    events_completed = events_completed + 1, 
                    boss_unlocked = CASE WHEN (events_completed + 1) >= events_required THEN TRUE ELSE boss_unlocked END,
                    last_played_at = NOW() 
                WHERE run_id = %s
            """,
                (run_id,),
            )
            return {"message": "Event completed and progress saved"}


@app.get("/api/events/next", response_model=dict)
def get_next_event(level: int = 1):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM event_templates ORDER BY RANDOM() LIMIT 1")
            template = cur.fetchone()

            if not template:
                raise HTTPException(status_code=404, detail="No event templates found")

            if template["event_type"].lower() == "combat":
                template_id = template["event_template_id"]
                enemy_id = EVENT_TO_ENEMY_MAP.get(template_id, 4)

                cur.execute("SELECT * FROM enemies WHERE enemy_id = %s", (enemy_id,))
                enemy = cur.fetchone()

                cur.execute("SELECT * FROM event_results WHERE event_result_id = 1")
                result = cur.fetchone()

                return {
                    "template": template,
                    "result": {
                        "event_result_id": result["event_result_id"],
                        "result_type": result["result_type"],
                        "notes": result["notes"],
                        "enemy_id": enemy["enemy_id"],
                        "enemy_name": enemy["name"],
                        "enemy_hp": enemy["base_hp"],
                    },
                }
            else:
                cur.execute(
                    "SELECT * FROM event_results WHERE result_type != 'Victory' ORDER BY RANDOM() LIMIT 1"
                )
                result = cur.fetchone()
                return {"template": template, "result": result}


@app.post("/api/users/register", response_model=UserResponse)
def register_user(user_data: UserCreate):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT user_id FROM users WHERE username = %s OR email = %s",
                (user_data.username, user_data.email),
            )
            if cur.fetchone():
                raise HTTPException(
                    status_code=400, detail="Username or email already registered"
                )

            hashed_password = pwd_context.hash(user_data.password)
            cur.execute(
                """
                INSERT INTO users (username, email, password_hash)
                VALUES (%s, %s, %s)
                RETURNING user_id, username, email, created_at;
            """,
                (user_data.username, user_data.email, hashed_password),
            )
            return cur.fetchone()


@app.post("/api/users/login")
def login_user(login_data: UserLogin):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM users WHERE username = %s", (login_data.username,)
            )
            user = cur.fetchone()

            if not user or not pwd_context.verify(
                login_data.password, user["password_hash"]
            ):
                raise HTTPException(
                    status_code=401, detail="Invalid username or password"
                )

            cur.execute(
                "UPDATE users SET last_login_at = NOW() WHERE user_id = %s",
                (user["user_id"],),
            )
            access_token = create_access_token(data={"sub": user["username"]})

            return {
                "access_token": access_token,
                "token_type": "bearer",
                "user_id": user["user_id"],
                "username": user["username"],
                "email": user["email"],
            }


@app.get("/api/users/me", response_model=UserResponse)
def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user


@app.get("/api/inventory/{character_id}", response_model=List[InventoryItemResponse])
def get_character_inventory(
    character_id: int, current_user: dict = Depends(get_current_user)
):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    ii.inventory_item_id,
                    it.name AS item_name,
                    it.item_type,
                    r.rarity_name,
                    r.hex_color,
                    ii.is_equipped,
                    (it.base_atk + ii.random_atk) AS total_item_atk,
                    (it.base_def + ii.random_def) AS total_item_def,
                    it.item_effect
                FROM inventory_items ii
                JOIN item_templates it ON ii.item_template_id = it.item_template_id
                JOIN rarity r ON ii.rarity_id = r.rarity_id
                JOIN characters c ON ii.character_id = c.character_id
                WHERE ii.character_id = %s AND c.user_id = %s
                ORDER BY ii.is_equipped DESC, r.rarity_id DESC;
            """,
                (character_id, current_user["user_id"]),
            )
            return cur.fetchall()


@app.post("/api/inventory/equip/{character_id}")
def equip_item(
    character_id: int,
    request: EquipItemRequest,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT character_id FROM characters WHERE character_id = %s AND user_id = %s",
                (character_id, current_user["user_id"]),
            )
            if not cur.fetchone():
                raise HTTPException(status_code=403, detail="Not authorized")

            cur.execute(
                """
                UPDATE inventory_items
                SET is_equipped = FALSE
                WHERE character_id = %s 
                  AND inventory_item_id IN (SELECT inventory_item_id FROM equipment WHERE character_id = %s AND slot = %s)
            """,
                (character_id, character_id, request.slot),
            )

            cur.execute(
                """
                INSERT INTO equipment (character_id, inventory_item_id, slot)
                VALUES (%s, %s, %s)
                ON CONFLICT (character_id, slot) 
                DO UPDATE SET inventory_item_id = EXCLUDED.inventory_item_id
            """,
                (character_id, request.inventory_item_id, request.slot),
            )

            cur.execute(
                "UPDATE inventory_items SET is_equipped = TRUE WHERE inventory_item_id = %s",
                (request.inventory_item_id,),
            )
            return {"message": f"Successfully equipped item to {request.slot}"}


@app.get("/api/shop/offers/{run_id}", response_model=List[ShopOfferResponse])
def get_shop_offers(run_id: int):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT current_day FROM game_runs WHERE run_id = %s", (run_id,)
            )
            run = cur.fetchone()
            if not run:
                raise HTTPException(status_code=404, detail="Run not found")

            cur.execute(
                """
                SELECT 
                    so.item_template_id,
                    it.name AS item_name,
                    it.item_type,
                    r.rarity_id,
                    r.rarity_name,
                    r.hex_color,
                    ROUND(so.price * r.sell_price_multiplier) AS dynamic_gold_cost,
                    it.item_effect
                FROM shop_offer so
                JOIN item_templates it ON so.item_template_id = it.item_template_id
                JOIN rarity r ON so.rarity_id = r.rarity_id
                WHERE so.day_number = %s;
            """,
                (run["current_day"],),
            )
            return cur.fetchall()
