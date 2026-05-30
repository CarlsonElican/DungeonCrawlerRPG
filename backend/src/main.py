# Ignore any missing import warnings in the backend for now
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from src.database import get_db
from src.schemas import (
    CharacterCreate,
    CharacterResponse,
    GameRunResponse,
    EventCompletionRequest,
    EventCompletionResponse,
    InventoryItemResponse,
    EquipItemRequest,
    InventoryItemActionRequest,
    ShopOfferResponse,
    ShopPurchaseRequest,
    UpgradeItemResponse,
    UserCreate,
    UserLogin,
    UserResponse,
)
from src.dependencies import get_current_user, pwd_context, create_access_token
from src.routes.combat import router as combat_router
from src.services.characters import fetch_character_sheet
from src.services.events import get_next_event as choose_next_event
from src.services.events import validate_event_result
from src.services.items import upgrade_inventory_item
from src.services.progression import advance_room_or_unlock_boss
from src.services.shop import get_or_create_shop_offers, purchase_shop_offer
from typing import List

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


# --- API ENDPOINTS ---

app.include_router(combat_router, prefix="/api/combat", tags=["Combat"])

STARTER_STAT_POINTS = 25
STARTER_BASE_STATS = {
    "base_hp": 50,
    "base_atk": 10,
    "base_def": 10,
    "base_spd": 50,
    "base_eva": 0.05,
    "base_crit_rate": 0.05,
    "base_crit_dmg": 1.50,
    "base_lifesteal": 0.00,
}
STARTER_STAT_GAINS = {
    "base_hp": 10,
    "base_atk": 1,
    "base_def": 1,
    "base_spd": 10,
    "base_eva": 0.01,
    "base_crit_rate": 0.01,
    "base_crit_dmg": 0.10,
    "base_lifesteal": 0.01,
}
STARTER_SKILLS = {"Strike", "Guard", "Quickstep", "First Aid"}


@app.on_event("startup")
def ensure_inventory_upgrade_columns():
    """Keeps existing local databases compatible with the item upgrade system."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                ALTER TABLE inventory_items
                    ADD COLUMN IF NOT EXISTS upgrade_hp INT DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS upgrade_atk INT DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS upgrade_def INT DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS upgrade_spd INT DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS upgrade_crit_rate NUMERIC(5,2) DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS upgrade_crit_dmg NUMERIC(5,2) DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS upgrade_eva NUMERIC(5,2) DEFAULT 0,
                    ADD COLUMN IF NOT EXISTS upgrade_lifesteal NUMERIC(5,2) DEFAULT 0;
                """)


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
                    c.base_hp + COALESCE(SUM(it.base_hp + ii.random_hp + ii.upgrade_hp), 0) AS total_hp,
                    c.base_atk + COALESCE(SUM(it.base_atk + ii.random_atk + ii.upgrade_atk), 0) AS total_atk,
                    c.base_def + COALESCE(SUM(it.base_def + ii.random_def + ii.upgrade_def), 0) AS total_def,
                    c.base_spd + COALESCE(SUM(it.base_spd + ii.random_spd + ii.upgrade_spd), 0) AS total_spd,
                    c.base_eva + COALESCE(SUM(it.base_eva + ii.random_eva + ii.upgrade_eva), 0) AS total_eva,
                    c.base_crit_rate + COALESCE(SUM(it.base_crit_rate + ii.random_crit_rate + ii.upgrade_crit_rate), 0) AS total_crit_rate,
                    c.base_crit_dmg + COALESCE(SUM(it.base_crit_dmg + ii.random_crit_dmg + ii.upgrade_crit_dmg), 0) AS total_crit_dmg,
                    c.base_lifesteal + COALESCE(SUM(it.base_lifesteal + ii.random_lifesteal + ii.upgrade_lifesteal), 0) AS total_lifesteal
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
    """Creates a new character and initializes their base stats and starter skill"""
    validate_starting_character(char_data)
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

            cur.execute(
                """
                INSERT INTO character_skills (character_id, skill_template_id)
                VALUES (%s, (SELECT skill_template_id FROM skill_templates WHERE name = %s));
                """,
                (new_char["character_id"], char_data.starter_skill),
            )

            new_char["total_hp"] = new_char["base_hp"]
            new_char["total_atk"] = new_char["base_atk"]
            new_char["total_def"] = new_char["base_def"]
            new_char["total_spd"] = new_char["base_spd"]
            new_char["total_eva"] = new_char["base_eva"]
            new_char["total_crit_rate"] = new_char["base_crit_rate"]
            new_char["total_crit_dmg"] = new_char["base_crit_dmg"]
            new_char["total_lifesteal"] = new_char["base_lifesteal"]

            return new_char


def validate_starting_character(char_data: CharacterCreate):
    if char_data.starter_skill not in STARTER_SKILLS:
        raise HTTPException(status_code=400, detail="Invalid starter skill")

    submitted_stats = {
        "base_hp": char_data.base_hp,
        "base_atk": char_data.base_atk,
        "base_def": char_data.base_def,
        "base_spd": char_data.base_spd,
        "base_eva": char_data.base_eva,
        "base_crit_rate": char_data.base_crit_rate,
        "base_crit_dmg": char_data.base_crit_dmg,
        "base_lifesteal": char_data.base_lifesteal,
    }
    spent_points = 0

    for stat_name, submitted_value in submitted_stats.items():
        base_value = STARTER_BASE_STATS[stat_name]
        gain_value = STARTER_STAT_GAINS[stat_name]
        raw_points = (float(submitted_value) - base_value) / gain_value
        rounded_points = round(raw_points)

        if rounded_points < 0 or abs(raw_points - rounded_points) > 0.001:
            raise HTTPException(
                status_code=400, detail="Invalid starting stat allocation"
            )

        spent_points += rounded_points

    if spent_points != STARTER_STAT_POINTS:
        raise HTTPException(
            status_code=400,
            detail=f"Starting characters must spend exactly {STARTER_STAT_POINTS} stat points",
        )


@app.get("/api/characters/{character_id}", response_model=CharacterResponse)
def get_character_sheet(character_id: int):
    """Fetches a character's dynamic stats (Base + Equipped Items) and unlocked skills"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    c.*,
                    -- 🌟 NEW: Aggregates active skill names into a list string (e.g. "Strike")
                    COALESCE((
                        SELECT STRING_AGG(st.name, ', ') 
                        FROM character_skills cs 
                        JOIN skill_templates st ON cs.skill_template_id = st.skill_template_id 
                        WHERE cs.character_id = c.character_id
                    ), 'None') AS active_skills,
                    
                    c.base_hp + COALESCE(SUM(it.base_hp + ii.random_hp + ii.upgrade_hp), 0) AS total_hp,
                    c.base_atk + COALESCE(SUM(it.base_atk + ii.random_atk + ii.upgrade_atk), 0) AS total_atk,
                    c.base_def + COALESCE(SUM(it.base_def + ii.random_def + ii.upgrade_def), 0) AS total_def,
                    c.base_spd + COALESCE(SUM(it.base_spd + ii.random_spd + ii.upgrade_spd), 0) AS total_spd,
                    c.base_eva + COALESCE(SUM(it.base_eva + ii.random_eva + ii.upgrade_eva), 0) AS total_eva,
                    c.base_crit_rate + COALESCE(SUM(it.base_crit_rate + ii.random_crit_rate + ii.upgrade_crit_rate), 0) AS total_crit_rate,
                    c.base_crit_dmg + COALESCE(SUM(it.base_crit_dmg + ii.random_crit_dmg + ii.upgrade_crit_dmg), 0) AS total_crit_dmg,
                    c.base_lifesteal + COALESCE(SUM(it.base_lifesteal + ii.random_lifesteal + ii.upgrade_lifesteal), 0) AS total_lifesteal
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


@app.post("/api/runs/{run_id}/complete-event", response_model=EventCompletionResponse)
def complete_event(
    run_id: int,
    request: EventCompletionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Records non-combat event completion and advances run progress."""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT gr.*
                FROM game_runs gr
                JOIN characters c ON c.character_id = gr.character_id
                WHERE gr.run_id = %s
                  AND c.user_id = %s
                  AND gr.ended_at IS NULL
                """,
                (run_id, current_user["user_id"]),
            )
            run = cur.fetchone()
            if not run:
                raise HTTPException(status_code=404, detail="Run not found")

            try:
                er = validate_event_result(
                    cur,
                    request.event_template_id,
                    request.event_result_id,
                    run["current_floor"],
                )
            except ValueError as exc:
                raise HTTPException(status_code=400, detail=str(exc))

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

            updated_run = advance_room_or_unlock_boss(cur, run_id)
            updated_character = fetch_character_sheet(cur, run["character_id"])
            return {
                "message": "Event completed and progress saved",
                "run": updated_run,
                "character": updated_character,
            }


@app.get("/api/events/next", response_model=dict)
def get_next_event(level: int = 1):
    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                return choose_next_event(cur, level=level)
            except ValueError as exc:
                raise HTTPException(status_code=404, detail=str(exc))


@app.get("/api/runs/{run_id}/next-event", response_model=dict)
def get_next_run_event(run_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT gr.*
                FROM game_runs gr
                JOIN characters c ON c.character_id = gr.character_id
                WHERE gr.run_id = %s
                  AND c.user_id = %s
                  AND gr.ended_at IS NULL
                """,
                (run_id, current_user["user_id"]),
            )
            run = cur.fetchone()
            if not run:
                raise HTTPException(status_code=404, detail="Active run not found")

            try:
                return choose_next_event(cur, run=run)
            except ValueError as exc:
                raise HTTPException(status_code=404, detail=str(exc))


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
                    it.description,
                    it.item_type,
                    r.rarity_name,
                    r.hex_color,
                    ii.is_equipped,
                    ii.upgraded_level,
                    e.slot AS equipped_slot,
                    GREATEST(
                        1,
                        ROUND(COALESCE(it.sell_amount, 1) * COALESCE(r.sell_price_multiplier, 1.0))
                    )::INTEGER AS sell_amount,
                    ii.item_effect,
                    it.base_hp AS base_item_hp,
                    it.base_atk AS base_item_atk,
                    it.base_def AS base_item_def,
                    it.base_spd AS base_item_spd,
                    it.base_crit_rate::FLOAT AS base_item_crit_rate,
                    it.base_crit_dmg::FLOAT AS base_item_crit_dmg,
                    it.base_eva::FLOAT AS base_item_eva,
                    it.base_lifesteal::FLOAT AS base_item_lifesteal,
                    ii.random_hp AS bonus_item_hp,
                    ii.random_atk AS bonus_item_atk,
                    ii.random_def AS bonus_item_def,
                    ii.random_spd AS bonus_item_spd,
                    ii.random_crit_rate::FLOAT AS bonus_item_crit_rate,
                    ii.random_crit_dmg::FLOAT AS bonus_item_crit_dmg,
                    ii.random_eva::FLOAT AS bonus_item_eva,
                    ii.random_lifesteal::FLOAT AS bonus_item_lifesteal,
                    ii.upgrade_hp AS upgrade_item_hp,
                    ii.upgrade_atk AS upgrade_item_atk,
                    ii.upgrade_def AS upgrade_item_def,
                    ii.upgrade_spd AS upgrade_item_spd,
                    ii.upgrade_crit_rate::FLOAT AS upgrade_item_crit_rate,
                    ii.upgrade_crit_dmg::FLOAT AS upgrade_item_crit_dmg,
                    ii.upgrade_eva::FLOAT AS upgrade_item_eva,
                    ii.upgrade_lifesteal::FLOAT AS upgrade_item_lifesteal,
                    (it.base_hp + ii.random_hp + ii.upgrade_hp) AS total_item_hp,
                    (it.base_atk + ii.random_atk + ii.upgrade_atk) AS total_item_atk,
                    (it.base_def + ii.random_def + ii.upgrade_def) AS total_item_def,
                    (it.base_spd + ii.random_spd + ii.upgrade_spd) AS total_item_spd,
                    (it.base_crit_rate + ii.random_crit_rate + ii.upgrade_crit_rate)::FLOAT AS total_item_crit_rate,
                    (it.base_crit_dmg + ii.random_crit_dmg + ii.upgrade_crit_dmg)::FLOAT AS total_item_crit_dmg,
                    (it.base_eva + ii.random_eva + ii.upgrade_eva)::FLOAT AS total_item_eva,
                    (it.base_lifesteal + ii.random_lifesteal + ii.upgrade_lifesteal)::FLOAT AS total_item_lifesteal,
                    CASE
                        WHEN ii.upgraded_level >= 10 THEN NULL
                        ELSE GREATEST(
                            1,
                            ROUND(
                                COALESCE(it.sell_amount, 1)
                                * COALESCE(r.sell_price_multiplier, 1.0)
                                * 0.25
                                * POWER(1.5, ii.upgraded_level)
                            )
                        )::INTEGER
                    END AS upgrade_cost
                FROM inventory_items ii
                JOIN item_templates it ON ii.item_template_id = it.item_template_id
                JOIN rarity r ON ii.rarity_id = r.rarity_id
                JOIN characters c ON ii.character_id = c.character_id
                LEFT JOIN equipment e ON e.inventory_item_id = ii.inventory_item_id
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
                SELECT it.item_type
                FROM inventory_items ii
                JOIN item_templates it ON ii.item_template_id = it.item_template_id
                WHERE ii.inventory_item_id = %s
                  AND ii.character_id = %s
                """,
                (request.inventory_item_id, character_id),
            )
            item = cur.fetchone()
            if not item:
                raise HTTPException(status_code=404, detail="Inventory item not found")
            if item["item_type"] != request.slot:
                raise HTTPException(
                    status_code=400,
                    detail=f"{item['item_type']} items can only be equipped in the {item['item_type']} slot",
                )

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


@app.post("/api/inventory/unequip/{character_id}")
def unequip_item(
    character_id: int,
    request: InventoryItemActionRequest,
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
                DELETE FROM equipment
                WHERE character_id = %s
                  AND inventory_item_id = %s
                """,
                (character_id, request.inventory_item_id),
            )

            cur.execute(
                """
                UPDATE inventory_items
                SET is_equipped = FALSE
                WHERE character_id = %s
                  AND inventory_item_id = %s
                """,
                (character_id, request.inventory_item_id),
            )

            return {"message": "Item unequipped"}


@app.post("/api/inventory/sell/{character_id}")
def sell_inventory_item(
    character_id: int,
    request: InventoryItemActionRequest,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    ii.inventory_item_id,
                    GREATEST(
                        1,
                        ROUND(COALESCE(it.sell_amount, 1) * COALESCE(r.sell_price_multiplier, 1.0))
                    )::INTEGER AS sell_amount
                FROM inventory_items ii
                JOIN item_templates it ON ii.item_template_id = it.item_template_id
                JOIN rarity r ON ii.rarity_id = r.rarity_id
                JOIN characters c ON ii.character_id = c.character_id
                WHERE ii.inventory_item_id = %s
                  AND ii.character_id = %s
                  AND c.user_id = %s
                """,
                (request.inventory_item_id, character_id, current_user["user_id"]),
            )
            item = cur.fetchone()
            if not item:
                raise HTTPException(status_code=404, detail="Inventory item not found")

            cur.execute(
                "DELETE FROM equipment WHERE inventory_item_id = %s",
                (request.inventory_item_id,),
            )
            cur.execute(
                """
                DELETE FROM inventory_items
                WHERE inventory_item_id = %s
                  AND character_id = %s
                """,
                (request.inventory_item_id, character_id),
            )
            cur.execute(
                """
                UPDATE characters
                SET current_gold = current_gold + %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE character_id = %s
                """,
                (item["sell_amount"], character_id),
            )

            return {"message": "Item sold", "gold_earned": item["sell_amount"]}


@app.post("/api/inventory/upgrade/{character_id}", response_model=UpgradeItemResponse)
def upgrade_item(
    character_id: int,
    request: InventoryItemActionRequest,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            try:
                upgrade = upgrade_inventory_item(
                    cur,
                    character_id,
                    current_user["user_id"],
                    request.inventory_item_id,
                )
            except ValueError as exc:
                status_code = (
                    400
                    if str(exc)
                    in {
                        "Not enough gold",
                        "Item is already at max upgrade level",
                    }
                    else 404
                )
                raise HTTPException(status_code=status_code, detail=str(exc))

            updated_character = fetch_character_sheet(cur, character_id)
            return {
                "message": "Item upgraded",
                **upgrade,
                "character": updated_character,
            }


@app.get("/api/shop/offers/{run_id}", response_model=List[ShopOfferResponse])
def get_shop_offers(run_id: int, current_user: dict = Depends(get_current_user)):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT gr.*
                FROM game_runs gr
                JOIN characters c ON gr.character_id = c.character_id
                WHERE gr.run_id = %s
                  AND c.user_id = %s
                  AND gr.ended_at IS NULL
                """,
                (run_id, current_user["user_id"]),
            )
            run = cur.fetchone()
            if not run:
                raise HTTPException(status_code=404, detail="Active run not found")

            return get_or_create_shop_offers(cur, run)


@app.post("/api/shop/buy/{run_id}")
def buy_shop_item(
    run_id: int,
    request: ShopPurchaseRequest,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT c.character_id, c.current_gold, c.level
                FROM game_runs gr
                JOIN characters c ON gr.character_id = c.character_id
                WHERE gr.run_id = %s
                  AND c.user_id = %s
                  AND gr.ended_at IS NULL
                """,
                (run_id, current_user["user_id"]),
            )
            character = cur.fetchone()
            if not character:
                raise HTTPException(status_code=404, detail="Active run not found")

            cur.execute("SELECT * FROM game_runs WHERE run_id = %s", (run_id,))
            run = cur.fetchone()
            try:
                purchase = purchase_shop_offer(
                    cur,
                    run,
                    character,
                    request.item_template_id,
                    request.rarity_id,
                    request.run_shop_offer_id,
                )
            except ValueError as exc:
                status_code = 400 if str(exc) == "Not enough gold" else 404
                raise HTTPException(status_code=status_code, detail=str(exc))

            return {"message": "Item purchased", **purchase}


@app.delete("/api/characters/{character_id}", status_code=status.HTTP_200_OK)
def delete_character(character_id: int, current_user: dict = Depends(get_current_user)):
    """
    Permanently purges a character profile.
    PostgreSQL schema constraints cascade deletions to game_runs, inventory, and equipment.
    """
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT character_id FROM characters WHERE character_id = %s AND user_id = %s",
                (character_id, current_user["user_id"]),
            )
            if not cur.fetchone():
                raise HTTPException(
                    status_code=404,
                    detail="Character profile not found or unauthorized to delete.",
                )

            cur.execute(
                "DELETE FROM characters WHERE character_id = %s AND user_id = %s",
                (character_id, current_user["user_id"]),
            )

            return {"detail": "Hero profile and all dependent records cleanly wiped."}


@app.get("/api/skills/templates")
def get_all_skill_templates():
    """Returns all available skills so the frontend can display them during character creation"""
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT name, description FROM skill_templates;")
            return cur.fetchall()
