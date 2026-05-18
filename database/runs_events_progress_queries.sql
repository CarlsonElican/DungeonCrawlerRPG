-- Start a new dungeon run for a character.
INSERT INTO game_runs (character_id)
VALUES (1);

-- Load the current unfinished run for a character.
SELECT
    run_id,
    character_id,
    current_day,
    current_floor,
    current_room,
    events_completed,
    events_required,
    boss_unlocked,
    max_gold_earned,
    started_at,
    last_played_at,
    ended_at
FROM game_runs
WHERE character_id = 1
  AND ended_at IS NULL
ORDER BY last_played_at DESC
LIMIT 1;

-- View all available room event templates.
SELECT
    event_template_id,
    name,
    event_type,
    description
FROM event_templates
ORDER BY event_type, name;

-- View possible event results that can be applied after an event.
SELECT
    event_result_id,
    result_type,
    gold_change,
    hp_change,
    exp_change,
    notes
FROM event_results
ORDER BY result_type, event_result_id;

-- Record that a room event was completed during a run.
INSERT INTO run_events (
    run_id,
    event_template_id,
    event_result_id,
    floor_number,
    room_number,
    sequence_number
)
VALUES (
    1,
    2,
    3,
    1,
    4,
    4
);

-- Apply the selected event result to the character's HP, gold, and XP.
UPDATE characters
SET current_hp = current_hp + (
        SELECT hp_change
        FROM event_results
        WHERE event_result_id = 3
    ),
    current_gold = current_gold + (
        SELECT gold_change
        FROM event_results
        WHERE event_result_id = 3
    ),
    experience = experience + (
        SELECT exp_change
        FROM event_results
        WHERE event_result_id = 3
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE character_id = 1;

-- Advance the run after a normal room event is completed.
UPDATE game_runs
SET current_room = current_room + 1,
    events_completed = events_completed + 1,
    last_played_at = CURRENT_TIMESTAMP
WHERE run_id = 1
  AND ended_at IS NULL;

-- Move the player to the next floor and reset room progress.
UPDATE game_runs
SET current_floor = current_floor + 1,
    current_room = 1,
    events_completed = 0,
    boss_unlocked = FALSE,
    last_played_at = CURRENT_TIMESTAMP
WHERE run_id = 1
  AND ended_at IS NULL;

-- Unlock the boss after the required number of events has been completed.
UPDATE game_runs
SET boss_unlocked = TRUE,
    last_played_at = CURRENT_TIMESTAMP
WHERE run_id = 1
  AND ended_at IS NULL
  AND events_completed >= events_required;

-- View the full event history for a run.
SELECT
    re.run_event_id,
    re.run_id,
    re.floor_number,
    re.room_number,
    re.sequence_number,
    et.name AS event_name,
    et.event_type,
    er.result_type,
    er.gold_change,
    er.hp_change,
    er.exp_change,
    er.notes,
    re.occurred_at
FROM run_events AS re
JOIN event_templates AS et
    ON re.event_template_id = et.event_template_id
JOIN event_results AS er
    ON re.event_result_id = er.event_result_id
WHERE re.run_id = 1
ORDER BY re.sequence_number;

-- Update a character's highest floor reached from the active run.
UPDATE characters
SET highest_floor_reached = GREATEST(highest_floor_reached, (
        SELECT current_floor
        FROM game_runs
        WHERE run_id = 1
    )),
    updated_at = CURRENT_TIMESTAMP
WHERE character_id = 1;

-- End a run when the player dies, wins, or exits the dungeon.
UPDATE game_runs
SET ended_at = CURRENT_TIMESTAMP,
    last_played_at = CURRENT_TIMESTAMP
WHERE run_id = 1
  AND ended_at IS NULL;
