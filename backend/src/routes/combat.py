from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from src.database import get_db
from src.dependencies import get_current_user
from src.services.combat import simulate_autobattle
from src.config import EVENT_TO_ENEMY_MAP
from src.schemas import CombatInitiativeRequest, CombatResponse

router = APIRouter()


@router.post("/resolve/{run_id}", response_model=CombatResponse)
def resolve_combat(
    run_id: int,
    req: CombatInitiativeRequest,
    current_user: dict = Depends(get_current_user),
):
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT r.character_id, r.current_floor, r.current_room 
                FROM game_runs r
                JOIN characters c ON r.character_id = c.character_id
                WHERE r.run_id = %s AND c.user_id = %s AND r.ended_at IS NULL
            """,
                (run_id, current_user["user_id"]),
            )
            run = cur.fetchone()
            if not run:
                raise HTTPException(
                    status_code=404, detail="Active run not found or unauthorized."
                )

            character_id = run["character_id"]

            cur.execute(
                "SELECT * FROM event_templates WHERE event_template_id = %s",
                (req.event_template_id,),
            )
            template = cur.fetchone()
            if not template:
                raise HTTPException(status_code=404, detail="Event template not found.")

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
            player = cur.fetchone()

            enemy_id = EVENT_TO_ENEMY_MAP.get(req.event_template_id, 4)
            cur.execute("SELECT * FROM enemies WHERE enemy_id = %s", (enemy_id,))
            enemy = cur.fetchone()
            if not enemy:
                raise HTTPException(
                    status_code=404, detail="Mapped monster pool data missing."
                )

            battle_results = simulate_autobattle(player, enemy)

            gold_earned = 0
            exp_earned = 0
            level_up_triggered = False
            chosen_result_id = 1 if battle_results["victory"] else 5

            if battle_results["victory"]:
                gold_earned = enemy["base_golddrop"]
                exp_earned = enemy["base_expdrop"]

                new_exp = player["experience"] + exp_earned
                if new_exp >= player["exp_cap"]:
                    level_up_triggered = True

                cur.execute(
                    """
                    UPDATE characters
                    SET 
                        kills = kills + 1,
                        current_gold = current_gold + %s,
                        current_hp = CASE WHEN %s THEN %s ELSE %s END,
                        level = CASE WHEN %s THEN level + 1 ELSE level END,
                        base_hp = CASE WHEN %s THEN base_hp + 15 ELSE base_hp END,
                        base_atk = CASE WHEN %s THEN base_atk + 3 ELSE base_atk END,
                        base_def = CASE WHEN %s THEN base_def + 2 ELSE base_def END,
                        experience = CASE WHEN %s THEN ( %s - exp_cap ) ELSE %s END,
                        exp_cap = CASE WHEN %s THEN ROUND(exp_cap * 1.5) ELSE exp_cap END,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE character_id = %s;
                """,
                    (
                        gold_earned,
                        level_up_triggered,
                        player["total_hp"] + 15,
                        battle_results["player_final_hp"],
                        level_up_triggered,
                        level_up_triggered,
                        level_up_triggered,
                        level_up_triggered,
                        level_up_triggered, 
                        new_exp,
                        new_exp,
                        level_up_triggered,
                        character_id,
                    ),
                )

                cur.execute(
                    """
                    UPDATE game_runs 
                    SET current_room = current_room + 1, 
                        events_completed = events_completed + 1,
                        last_played_at = NOW() 
                    WHERE run_id = %s
                """,
                    (run_id,),
                )

            else:
                gold_lost = round(player["current_gold"] * 0.5)

                cur.execute(
                    """
                    UPDATE characters
                    SET deaths = deaths + 1,
                        current_gold = GREATEST(0, current_gold - %s),
                        current_hp = base_hp, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE character_id = %s;
                """,
                    (gold_lost, character_id),
                )

                cur.execute(
                    """
                    UPDATE game_runs 
                    SET ended_at = NOW(), 
                        last_played_at = NOW() 
                    WHERE run_id = %s
                """,
                    (run_id,),
                )

                battle_results["log"].append(
                    f"💀 You perished in battle! Lost {gold_lost} Gold. Run Ended."
                )

            cur.execute(
                """
                INSERT INTO run_events (run_id, event_template_id, event_result_id, floor_number, room_number)
                VALUES (%s, %s, %s, %s, %s);
            """,
                (
                    run_id,
                    req.event_template_id,
                    chosen_result_id,
                    run["current_floor"],
                    run["current_room"],
                ),
            )

            return {
                "victory": battle_results["victory"],
                "player_final_hp": battle_results["player_final_hp"],
                "enemy_final_hp": battle_results["enemy_final_hp"],
                "gold_earned": gold_earned if battle_results["victory"] else gold_lost,
                "exp_earned": exp_earned,
                "level_up_triggered": level_up_triggered,
                "combat_log": battle_results["log"],
            }
