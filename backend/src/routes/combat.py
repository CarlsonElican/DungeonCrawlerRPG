from fastapi import APIRouter, Depends, HTTPException

from src.database import get_db
from src.dependencies import get_current_user
from src.schemas import CombatInitiativeRequest, CombatResponse
from src.services.characters import fetch_character_sheet
from src.services.combat import simulate_autobattle
from src.services.events import fetch_enemy_for_event
from src.services.items import insert_inventory_item
from src.services.loot import calculate_monster_drop_multiple
from src.services.progression import (
    advance_floor_after_boss,
    advance_room_or_unlock_boss,
    handle_death,
)

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
                SELECT r.*
                FROM game_runs r
                JOIN characters c ON r.character_id = c.character_id
                WHERE r.run_id = %s
                  AND c.user_id = %s
                  AND r.ended_at IS NULL
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
            if template["event_type"].lower() != "combat":
                raise HTTPException(
                    status_code=400, detail="Event is not a combat event."
                )

            cur.execute(
                """
                SELECT
                    c.*,
                    c.base_hp + COALESCE(SUM(ii.random_hp + ii.upgrade_hp), 0) AS total_hp,
                    c.base_atk + COALESCE(SUM(ii.random_atk + ii.upgrade_atk), 0) AS total_atk,
                    c.base_def + COALESCE(SUM(ii.random_def + ii.upgrade_def), 0) AS total_def,
                    c.base_spd + COALESCE(SUM(ii.random_spd + ii.upgrade_spd), 0) AS total_spd,
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
            player = cur.fetchone()

            try:
                enemy = fetch_enemy_for_event(
                    cur,
                    req.event_template_id,
                    run["current_floor"],
                    run["current_room"],
                )
            except ValueError:
                raise HTTPException(
                    status_code=404, detail="Mapped monster pool data missing."
                )

            battle_results = simulate_autobattle(player, enemy)

            gold_earned = 0
            exp_earned = 0
            gold_lost = 0
            level_up_triggered = False
            chosen_result_id = 1 if battle_results["victory"] else 5
            updated_run = None

            if battle_results["victory"]:
                gold_earned = enemy["base_golddrop"]
                exp_earned = enemy["base_expdrop"]

                dropped_items = calculate_monster_drop_multiple(
                    cur, enemy["enemy_id"], enemy["type"]
                )

                for drop in dropped_items:
                    insert_inventory_item(
                        cur=cur,
                        character_id=character_id,
                        item_template_id=drop["item_template_id"],
                        rarity_id=drop["rarity_id"],
                        item_level=enemy["level"],
                        item_effect="Snatched from a fallen foe",
                    )

                    cur.execute(
                        "SELECT name FROM item_templates WHERE item_template_id = %s",
                        (drop["item_template_id"],),
                    )
                    item_data = cur.fetchone()

                    battle_results["log"].append(
                        f"🎁 Drop Triggered! You salvaged: <span style=\"color:{drop['hex_color']}; font-weight:bold;\">[{drop['rarity_name']}] {item_data['name']}</span> from the corpse."
                    )

                current_level = player["level"]
                current_exp = player["experience"] + exp_earned
                current_cap = player["exp_cap"]

                bonus_hp = 0
                bonus_atk = 0
                bonus_def = 0

                while current_exp >= current_cap:
                    level_up_triggered = True
                    current_level += 1
                    current_exp -= current_cap
                    current_cap = round(current_cap * 1.5)

                    bonus_hp += 15
                    bonus_atk += 3
                    bonus_def += 2

                cur.execute(
                    """
                    UPDATE characters
                    SET
                        kills = kills + 1,
                        current_gold = current_gold + %s,
                        current_hp = CASE WHEN %s THEN (base_hp + %s) ELSE %s END,
                        level = %s,
                        base_hp = base_hp + %s,
                        base_atk = base_atk + %s,
                        base_def = base_def + %s,
                        experience = %s,
                        exp_cap = %s,
                        highest_floor_reached = GREATEST(highest_floor_reached, %s),
                        updated_at = CURRENT_TIMESTAMP
                    WHERE character_id = %s;
                    """,
                    (
                        gold_earned,
                        level_up_triggered,
                        bonus_hp,
                        battle_results["player_final_hp"],
                        current_level,
                        bonus_hp,
                        bonus_atk,
                        bonus_def,
                        current_exp,
                        current_cap,
                        run["current_floor"],
                        character_id,
                    ),
                )

                if enemy["type"].lower() == "boss":
                    updated_run = advance_floor_after_boss(cur, run, character_id)
                    battle_results["log"].append(
                        "Boss defeated! You recover to full health and descend to the next floor."
                    )
                else:
                    updated_run = advance_room_or_unlock_boss(cur, run_id)
            else:
                gold_lost = round(player["current_gold"] * 0.5)
                updated_run = handle_death(cur, run_id, character_id, gold_lost)
                battle_results["log"].append(
                    f"You perished in battle! Lost {gold_lost} Gold and returned to the first room of this floor."
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
                "run": updated_run,
                "character": fetch_character_sheet(cur, character_id),
            }
