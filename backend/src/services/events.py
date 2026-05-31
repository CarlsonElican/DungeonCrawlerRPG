import random
from typing import Any, Dict, Optional

from src.services.scaling import scale_enemy, scale_event_result


COMBAT_EVENT_CHANCE = 0.45


def _weighted_order_sql(weight_column: str = "weight") -> str:
    return f"(-LN(GREATEST(RANDOM(), 0.000001)) / NULLIF({weight_column}, 0))"


def _fetch_random_event_template(cur, floor: int, combat: bool) -> Optional[Dict[str, Any]]:
    if combat:
        cur.execute(
            """
            SELECT *
            FROM (
                SELECT DISTINCT et.*
                FROM event_templates et
                JOIN event_template_enemies ete ON ete.event_template_id = et.event_template_id
                JOIN enemies e ON e.enemy_id = ete.enemy_id
                JOIN event_template_results etr ON etr.event_template_id = et.event_template_id
                WHERE LOWER(et.event_type) = 'combat'
                  AND etr.min_floor <= %s
                  AND (etr.max_floor IS NULL OR etr.max_floor >= %s)
                  AND ete.min_floor <= %s
                  AND (ete.max_floor IS NULL OR ete.max_floor >= %s)
                  AND COALESCE(LOWER(e.type), '') != 'boss'
            ) eligible_templates
            ORDER BY RANDOM()
            LIMIT 1;
            """,
            (floor, floor, floor, floor),
        )
    else:
        cur.execute(
            """
            SELECT *
            FROM (
                SELECT DISTINCT et.*
                FROM event_templates et
                JOIN event_template_results etr ON etr.event_template_id = et.event_template_id
                WHERE LOWER(et.event_type) != 'combat'
                  AND etr.min_floor <= %s
                  AND (etr.max_floor IS NULL OR etr.max_floor >= %s)
            ) eligible_templates
            ORDER BY RANDOM()
            LIMIT 1;
            """,
            (floor, floor),
        )
    return cur.fetchone()


def fetch_enemy_for_event(cur, event_template_id: int, floor: int, room: int) -> Dict[str, Any]:
    cur.execute(
        f"""
        SELECT e.*
        FROM event_template_enemies ete
        JOIN enemies e ON e.enemy_id = ete.enemy_id
        WHERE ete.event_template_id = %s
          AND ete.min_floor <= %s
          AND (ete.max_floor IS NULL OR ete.max_floor >= %s)
        ORDER BY {_weighted_order_sql("ete.weight")}
        LIMIT 1;
        """,
        (event_template_id, floor, floor),
    )
    enemy = cur.fetchone()
    if not enemy:
        raise ValueError("No enemy mapping found for event")
    return scale_enemy(enemy, floor, room)


def get_next_event(cur, run: Optional[Dict[str, Any]] = None, level: int = 1) -> Dict[str, Any]:
    floor = run["current_floor"] if run else max(level, 1)
    room = run["current_room"] if run else 1

    if run and run["boss_unlocked"]:
        cur.execute(
            f"""
            SELECT et.*
            FROM event_templates et
            JOIN event_template_enemies ete ON ete.event_template_id = et.event_template_id
            JOIN enemies e ON e.enemy_id = ete.enemy_id
            WHERE LOWER(e.type) = 'boss'
              AND ete.min_floor <= %s
              AND (ete.max_floor IS NULL OR ete.max_floor >= %s)
            ORDER BY {_weighted_order_sql("ete.weight")}
            LIMIT 1;
            """,
            (floor, floor),
        )
        template = cur.fetchone()
    else:
        should_choose_combat = random.random() < COMBAT_EVENT_CHANCE
        template = _fetch_random_event_template(cur, floor, combat=should_choose_combat)
        if not template:
            template = _fetch_random_event_template(cur, floor, combat=not should_choose_combat)

    if not template:
        raise ValueError("No event templates found")

    if template["event_type"].lower() == "combat":
        enemy = fetch_enemy_for_event(cur, template["event_template_id"], floor, room)
        cur.execute("SELECT * FROM event_results WHERE result_type = 'Victory' LIMIT 1")
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

    cur.execute(
        f"""
        SELECT er.*
        FROM event_template_results etr
        JOIN event_results er ON er.event_result_id = etr.event_result_id
        WHERE etr.event_template_id = %s
          AND etr.min_floor <= %s
          AND (etr.max_floor IS NULL OR etr.max_floor >= %s)
        ORDER BY {_weighted_order_sql("etr.weight")}
        LIMIT 1;
        """,
        (template["event_template_id"], floor, floor),
    )
    result = cur.fetchone()
    if not result:
        raise ValueError("No event result mapping found")
    return {"template": template, "result": scale_event_result(result, floor)}


def validate_event_result(cur, event_template_id: int, event_result_id: int, floor: int) -> Dict[str, Any]:
    cur.execute(
        """
        SELECT er.*
        FROM event_template_results etr
        JOIN event_results er ON er.event_result_id = etr.event_result_id
        WHERE etr.event_template_id = %s
          AND etr.event_result_id = %s
          AND etr.min_floor <= %s
          AND (etr.max_floor IS NULL OR etr.max_floor >= %s)
        """,
        (event_template_id, event_result_id, floor, floor),
    )
    result = cur.fetchone()
    if not result:
        raise ValueError("Event result is not valid for this event")
    return scale_event_result(result, floor)
