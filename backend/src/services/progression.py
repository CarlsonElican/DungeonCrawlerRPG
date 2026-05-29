from typing import Any, Dict, Optional


ROOMS_PER_FLOOR = 10


def fetch_run(cur, run_id: int) -> Optional[Dict[str, Any]]:
    cur.execute("SELECT * FROM game_runs WHERE run_id = %s AND ended_at IS NULL", (run_id,))
    return cur.fetchone()


def fetch_character(cur, character_id: int) -> Optional[Dict[str, Any]]:
    cur.execute("SELECT * FROM characters WHERE character_id = %s", (character_id,))
    return cur.fetchone()


def advance_room_or_unlock_boss(cur, run_id: int) -> Dict[str, Any]:
    cur.execute(
        """
        UPDATE game_runs
        SET current_room = current_room + 1,
            events_completed = events_completed + 1,
            boss_unlocked = CASE
                WHEN (events_completed + 1) >= events_required THEN TRUE
                ELSE boss_unlocked
            END,
            last_played_at = NOW()
        WHERE run_id = %s
          AND ended_at IS NULL
        RETURNING *;
        """,
        (run_id,),
    )
    return cur.fetchone()


def advance_floor_after_boss(cur, run: Dict[str, Any], character_id: int) -> Dict[str, Any]:
    current_floor = run["current_floor"]

    cur.execute(
        """
        SELECT gold_reward, exp_reward
        FROM floor_rewards
        WHERE floor_number = %s
        """,
        (current_floor,),
    )
    reward = cur.fetchone() or {"gold_reward": 100 * current_floor, "exp_reward": 75 * current_floor}

    cur.execute(
        """
        UPDATE characters
        SET current_hp = base_hp,
            current_gold = current_gold + %s,
            experience = experience + %s,
            highest_floor_reached = GREATEST(highest_floor_reached, %s),
            updated_at = CURRENT_TIMESTAMP
        WHERE character_id = %s
        """,
        (
            reward["gold_reward"],
            reward["exp_reward"],
            current_floor + 1,
            character_id,
        ),
    )

    cur.execute(
        """
        UPDATE game_runs
        SET current_floor = current_floor + 1,
            current_room = 1,
            events_completed = 0,
            boss_unlocked = FALSE,
            last_played_at = NOW()
        WHERE run_id = %s
          AND ended_at IS NULL
        RETURNING *;
        """,
        (run["run_id"],),
    )
    return cur.fetchone()


def handle_death(cur, run_id: int, character_id: int, gold_lost: int) -> Dict[str, Any]:
    cur.execute(
        """
        UPDATE characters
        SET deaths = deaths + 1,
            current_gold = GREATEST(0, current_gold - %s),
            current_hp = base_hp,
            updated_at = CURRENT_TIMESTAMP
        WHERE character_id = %s
        """,
        (gold_lost, character_id),
    )

    cur.execute(
        """
        UPDATE game_runs
        SET current_room = 1,
            events_completed = 0,
            boss_unlocked = FALSE,
            last_played_at = NOW()
        WHERE run_id = %s
          AND ended_at IS NULL
        RETURNING *;
        """,
        (run_id,),
    )
    return cur.fetchone()
