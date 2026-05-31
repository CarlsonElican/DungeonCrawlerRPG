-- ============================================================================
-- ADMINISTRATIVE SCHEMA MIGRATIONS & DATA PATCHES
-- Context: One-time scripts run to update features and game content pools.
-- ============================================================================

-- 1. Blacksmith Upgrade Columns Schema Migration
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS upgrade_hp INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_atk INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_def INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_spd INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_crit_rate NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_crit_dmg NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_eva NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_lifesteal NUMERIC(5,2) DEFAULT 0;

-- 2. Non-Combat Text Event Content Pool Expansion Data Patch
UPDATE event_templates
SET name = 'Loot Corpse', event_type = 'Treasure', description = 'A fallen adventurer lies nearby with a coin pouch still intact.'
WHERE name = 'Merchant Camp';

INSERT INTO event_templates (name, event_type, description)
SELECT 'Loot Corpse', 'Treasure', 'A fallen adventurer lies nearby with a coin pouch still intact.'
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE name = 'Loot Corpse');

INSERT INTO event_templates (name, event_type, description)
SELECT 'Hidden Treasure Room', 'Treasure', 'A loose stone reveals a hidden chamber glittering with forgotten riches.'
WHERE NOT EXISTS (SELECT 1 FROM event_templates WHERE name = 'Hidden Treasure Room');

INSERT INTO event_results (result_type, gold_change, hp_change, exp_change, notes)
SELECT 'Looted Corpse', 50, 0, 0, 'Searched a fallen adventurer and recovered their spare gold.'
WHERE NOT EXISTS (SELECT 1 FROM event_results WHERE result_type = 'Looted Corpse');

INSERT INTO event_results (result_type, gold_change, hp_change, exp_change, notes)
SELECT 'Hidden Treasure Room', 200, 0, 0, 'Discovered a hidden treasure room packed with gold.'
WHERE NOT EXISTS (SELECT 1 FROM event_results WHERE result_type = 'Hidden Treasure Room');

DELETE FROM event_template_results
WHERE event_template_id IN (
    SELECT event_template_id FROM event_templates WHERE name IN ('Loot Corpse', 'Hidden Treasure Room')
);

INSERT INTO event_template_results (event_template_id, event_result_id, weight, min_floor, max_floor)
SELECT et.event_template_id, er.event_result_id, 1.00, 1, NULL
FROM event_templates et JOIN event_results er ON er.result_type = 'Looted Corpse' WHERE et.name = 'Loot Corpse';

INSERT INTO event_template_results (event_template_id, event_result_id, weight, min_floor, max_floor)
SELECT et.event_template_id, er.event_result_id, 1.00, 2, NULL
FROM event_templates et JOIN event_results er ON er.result_type = 'Hidden Treasure Room' WHERE et.name = 'Hidden Treasure Room';


-- ============================================================================
-- FILE: src/routes/combat.py 
-- ============================================================================

-- 1. Verify user ownership and status of an active game run
SELECT r.*
FROM game_runs r
JOIN characters c ON r.character_id = c.character_id
WHERE r.run_id = %s AND c.user_id = %s AND r.ended_at IS NULL;

-- 2. Validate existence and type of an event template
SELECT * FROM event_templates WHERE event_template_id = %s;

-- 3. Fetch character stats combined with active equipment item attributes
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

-- 4. Get item template name for combat drop interfaces
SELECT name FROM item_templates WHERE item_template_id = %s;

-- 5. Update gold, experience, and scale base stats on combat victory or level up
UPDATE characters
SET kills = kills + 1,
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

-- 6. Log resolved combat event metrics into history table
INSERT INTO run_events (run_id, event_template_id, event_result_id, floor_number, room_number)
VALUES (%s, %s, %s, %s, %s);

-- ============================================================================
-- FILE: src/services/characters.py
-- ============================================================================

-- 1. Fetch character details alongside all equipped items stat contributions
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
WHERE c.character_id = %s
GROUP BY c.character_id;

-- ============================================================================
-- FILE: src/services/events.py
-- ============================================================================

-- 1. Find a random combat event blueprint valid for the current floor
SELECT * FROM (
    SELECT DISTINCT et.*
    FROM event_templates et
    JOIN event_template_enemies ete ON ete.event_template_id = et.event_template_id
    JOIN enemies e ON e.enemy_id = ete.enemy_id
    JOIN event_template_results etr ON etr.event_template_id = et.event_template_id
    WHERE LOWER(et.event_type) = 'combat' AND etr.min_floor <= %s AND (etr.max_floor IS NULL OR etr.max_floor >= %s)
      AND ete.min_floor <= %s AND (ete.max_floor IS NULL OR ete.max_floor >= %s) AND COALESCE(LOWER(e.type), '') != 'boss'
) eligible_templates ORDER BY RANDOM() LIMIT 1;

-- 2. Find a random story or treasure event template valid for the current floor
SELECT * FROM (
    SELECT DISTINCT et.*
    FROM event_templates et
    JOIN event_template_results etr ON etr.event_template_id = et.event_template_id
    WHERE LOWER(et.event_type) != 'combat' AND etr.min_floor <= %s AND (etr.max_floor IS NULL OR etr.max_floor >= %s)
) eligible_templates ORDER BY RANDOM() LIMIT 1;

-- 3. Select a monster for a room using logarithmic weight calculations
SELECT e.*
FROM event_template_enemies ete
JOIN enemies e ON e.enemy_id = ete.enemy_id
WHERE ete.event_template_id = %s AND ete.min_floor <= %s AND (ete.max_floor IS NULL OR ete.max_floor >= %s)
ORDER BY (-LN(GREATEST(RANDOM(), 0.000001)) / NULLIF(ete.weight, 0)) LIMIT 1;

-- 4. Grab floor boss encounter data 
SELECT et.*
FROM event_templates et
JOIN event_template_enemies ete ON ete.event_template_id = et.event_template_id
JOIN enemies e ON e.enemy_id = ete.enemy_id
WHERE LOWER(e.type) = 'boss' AND ete.min_floor <= %s AND (ete.max_floor IS NULL OR ete.max_floor >= %s)
ORDER BY (-LN(GREATEST(RANDOM(), 0.000001)) / NULLIF(ete.weight, 0)) LIMIT 1;

-- 5. Fetch structural record schema data for combat victories
SELECT * FROM event_results WHERE result_type = 'Victory' LIMIT 1;

-- 6. Pick a random choice consequence result based on table drop weight limits
SELECT er.*
FROM event_template_results etr
JOIN event_results er ON er.event_result_id = etr.event_result_id
WHERE etr.event_template_id = %s AND etr.min_floor <= %s AND (etr.max_floor IS NULL OR etr.max_floor >= %s)
ORDER BY (-LN(GREATEST(RANDOM(), 0.000001)) / NULLIF(etr.weight, 0)) LIMIT 1;

-- 7. Audit event choice input legality for incoming API requests
SELECT er.*
FROM event_template_results etr
JOIN event_results er ON er.event_result_id = etr.event_result_id
WHERE etr.event_template_id = %s AND etr.event_result_id = %s AND etr.min_floor <= %s AND (etr.max_floor IS NULL OR etr.max_floor >= %s);

-- ============================================================================
-- FILE: src/services/items.py
-- ============================================================================

-- 1. Grab item base attributes combined with cross-joined rarity multipliers
SELECT it.*, r.stat_multiplier
FROM item_templates it CROSS JOIN rarity r
WHERE it.item_template_id = %s AND r.rarity_id = %s;

-- 2. Save a newly rolled or bought gear item instance to character inventory
INSERT INTO inventory_items (
    character_id, item_template_id, rarity_id, item_level, item_effect,
    random_hp, random_atk, random_def, random_spd, random_crit_rate, random_crit_dmg, random_eva, random_lifesteal
) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING inventory_item_id;

-- 3. Fetch item structural integrity and player wallet balances prior to upgrading
SELECT
    c.character_id, c.current_gold, ii.inventory_item_id, ii.item_level, ii.upgraded_level,
    it.sell_amount, it.base_hp, it.base_atk, it.base_def, it.base_spd,
    it.base_crit_rate, it.base_crit_dmg, it.base_eva, it.base_lifesteal, r.sell_price_multiplier, r.stat_multiplier
FROM inventory_items ii
JOIN characters c ON c.character_id = ii.character_id
JOIN item_templates it ON it.item_template_id = ii.item_template_id
JOIN rarity r ON r.rarity_id = ii.rarity_id
WHERE ii.inventory_item_id = %s AND ii.character_id = %s AND c.user_id = %s;

-- 4. Deduct gold cost from character wallet for blacksmith transactions
UPDATE characters
SET current_gold = current_gold - %s, updated_at = CURRENT_TIMESTAMP
WHERE character_id = %s AND current_gold >= %s;

-- 5. Advance item modification level and add chosen dynamic stat upgrade values
UPDATE inventory_items
SET upgraded_level = %s, {stat_column} = {stat_column} + %s
WHERE inventory_item_id = %s RETURNING inventory_item_id, upgraded_level;

-- ============================================================================
-- FILE: src/services/loot.py
-- ============================================================================

-- 1. Select eligible item templates mapped to an enemy template
SELECT item_template_id, weight FROM loot_table WHERE enemy_id = %s;

-- 2. Fetch global baseline rarity configurations and distribution weight values
SELECT rarity_id, rarity_name, hex_color, weight FROM rarity;

-- ============================================================================
-- FILE: src/services/progression.py
-- ============================================================================

-- 1. Grab an ongoing active game run record row entry
SELECT * FROM game_runs WHERE run_id = %s AND ended_at IS NULL;

-- 2. Extract specific character configuration snapshots
SELECT * FROM characters WHERE character_id = %s;

-- 3. Advance run room step, complete log entries, and check boss availability triggers
UPDATE game_runs
SET current_room = current_room + 1,
    events_completed = events_completed + 1,
    boss_unlocked = CASE WHEN (events_completed + 1) >= events_required THEN TRUE ELSE boss_unlocked END,
    last_played_at = NOW()
WHERE run_id = %s AND ended_at IS NULL RETURNING *;

-- 4. Find dynamic milestone rewards mapped to a cleared floor
SELECT gold_reward, exp_reward FROM floor_rewards WHERE floor_number = %s;

-- 5. Full heal player character and award floor-clear gold and experience rewards
UPDATE characters
SET current_hp = base_hp, current_gold = current_gold + %s, experience = experience + %s,
    highest_floor_reached = GREATEST(highest_floor_reached, %s), updated_at = CURRENT_TIMESTAMP
WHERE character_id = %s;

-- 6. Advance campaign track to next floor layer and reset room trackers
UPDATE game_runs
SET current_floor = current_floor + 1, current_room = 1, events_completed = 0, boss_unlocked = FALSE, last_played_at = NOW()
WHERE run_id = %s AND ended_at IS NULL RETURNING *;

-- 7. Add to player profile death count, wipe current health pools, and deduct gold penalty
UPDATE characters
SET deaths = deaths + 1, current_gold = GREATEST(0, current_gold - %s), current_hp = base_hp, updated_at = CURRENT_TIMESTAMP
WHERE character_id = %s;

-- 8. Return player run back to room 1 of their current floor upon defeat
UPDATE game_runs
SET current_room = 1, events_completed = 0, boss_unlocked = FALSE, last_played_at = NOW()
WHERE run_id = %s AND ended_at IS NULL RETURNING *;

-- ============================================================================
-- FILE: src/services/shop.py
-- ============================================================================

-- 1. Fetch active merchant offerings with dynamic cost and scaled stat values built-in
SELECT
    rso.run_shop_offer_id, it.item_template_id, it.name AS item_name, it.description, it.item_type,
    r.rarity_id, r.rarity_name, r.hex_color, rso.price AS dynamic_gold_cost, NULL::TEXT AS item_effect,
    it.base_hp AS base_item_hp, it.base_atk AS base_item_atk, it.base_def AS base_item_def, it.base_spd AS base_item_spd,
    it.base_crit_rate::FLOAT AS base_item_crit_rate, it.base_crit_dmg::FLOAT AS base_item_crit_dmg, it.base_eva::FLOAT AS base_item_eva, it.base_lifesteal::FLOAT AS base_item_lifesteal,
    ROUND((it.base_hp * (1.0 + (GREATEST(rso.floor_number, 1) - 1) * 0.10)) * (r.stat_multiplier - 1))::INTEGER AS bonus_item_hp,
    ROUND((it.base_atk * (1.0 + (GREATEST(rso.floor_number, 1) - 1) * 0.10)) * (r.stat_multiplier - 1))::INTEGER AS bonus_item_atk,
    ROUND((it.base_def * (1.0 + (GREATEST(rso.floor_number, 1) - 1) * 0.10)) * (r.stat_multiplier - 1))::INTEGER AS bonus_item_def,
    ROUND((it.base_spd * (1.0 + (GREATEST(rso.floor_number, 1) - 1) * 0.10)) * (r.stat_multiplier - 1))::INTEGER AS bonus_item_spd,
    ROUND(it.base_crit_rate * (r.stat_multiplier - 1), 2)::FLOAT AS bonus_item_crit_rate,
    ROUND(it.base_crit_dmg * (r.stat_multiplier - 1), 2)::FLOAT AS bonus_item_crit_dmg,
    ROUND(it.base_eva * (r.stat_multiplier - 1), 2)::FLOAT AS bonus_item_eva,
    ROUND(it.base_lifesteal * (r.stat_multiplier - 1), 2)::FLOAT AS bonus_item_lifesteal,
    ROUND((it.base_hp * (1.0 + (GREATEST(rso.floor_number, 1) - 1) * 0.10)) * r.stat_multiplier)::INTEGER AS total_item_hp,
    ROUND((it.base_atk * (1.0 + (GREATEST(rso.floor_number, 1) - 1) * 0.10)) * r.stat_multiplier)::INTEGER AS total_item_atk,
    ROUND((it.base_def * (1.0 + (GREATEST(rso.floor_number, 1) - 1) * 0.10)) * r.stat_multiplier)::INTEGER AS total_item_def,
    ROUND((it.base_spd * (1.0 + (GREATEST(rso.floor_number, 1) - 1) * 0.10)) * r.stat_multiplier)::INTEGER AS total_item_spd,
    ROUND(it.base_crit_rate * r.stat_multiplier, 2)::FLOAT AS total_item_crit_rate,
    ROUND(it.base_crit_dmg * r.stat_multiplier, 2)::FLOAT AS total_item_crit_dmg,
    ROUND(it.base_eva * r.stat_multiplier, 2)::FLOAT AS total_item_eva,
    ROUND(it.base_lifesteal * r.stat_multiplier, 2)::FLOAT AS total_item_lifesteal
FROM run_shop_offers rso JOIN item_templates it ON it.item_template_id = rso.item_template_id JOIN rarity r ON r.rarity_id = rso.rarity_id
{where_clause} ORDER BY r.rarity_id DESC, it.name;

-- 2. Select randomized base templates to stock new shop layouts
SELECT * FROM item_templates ORDER BY RANDOM() LIMIT %s;

-- 3. Roll a weighted random rarity level for merchant inventory generations
SELECT * FROM rarity ORDER BY (-LN(GREATEST(RANDOM(), 0.000001)) / NULLIF(weight, 0)) LIMIT 1;

-- 4. Store a generated line item offering tracking card row inside merchant tables
INSERT INTO run_shop_offers (run_id, floor_number, room_number, item_template_id, rarity_id, price) VALUES (%s, %s, %s, %s, %s, %s);

-- 5. Validate specific merchant item offer status via core identification lookup
SELECT * FROM run_shop_offers WHERE run_shop_offer_id = %s AND run_id = %s AND floor_number = %s AND room_number = %s AND purchased_at IS NULL;

-- 6. Backup validation matching vendor stock based on layout composite keys
SELECT * FROM run_shop_offers WHERE run_id = %s AND floor_number = %s AND room_number = %s AND item_template_id = %s AND rarity_id = %s AND purchased_at IS NULL
ORDER BY run_shop_offer_id LIMIT 1;

-- 7. Deduct wallet currency following validated store checkout actions
UPDATE characters SET current_gold = current_gold - %s, updated_at = CURRENT_TIMESTAMP WHERE character_id = %s AND current_gold >= %s;

-- 8. Finalize transaction row records to lock target vendor inventory slots
UPDATE run_shop_offers SET purchased_at = NOW() WHERE run_shop_offer_id = %s;

-- ============================================================================
-- FILE: src/dependencies.py
-- ============================================================================

-- 1. Resolve active JWT session tokens against account rows
SELECT user_id, username, email, created_at FROM users WHERE username = %s;

-- ============================================================================
-- FILE: main.py
-- ============================================================================

-- 1. Ensure required blacksmith columns exist in the system architecture
ALTER TABLE inventory_items
    ADD COLUMN IF NOT EXISTS upgrade_hp INT DEFAULT 0, ADD COLUMN IF NOT EXISTS upgrade_atk INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_def INT DEFAULT 0, ADD COLUMN IF NOT EXISTS upgrade_spd INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_crit_rate NUMERIC(5,2) DEFAULT 0, ADD COLUMN IF NOT EXISTS upgrade_crit_dmg NUMERIC(5,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS upgrade_eva NUMERIC(5,2) DEFAULT 0, ADD COLUMN IF NOT EXISTS upgrade_lifesteal NUMERIC(5,2) DEFAULT 0;

-- 2. Audit database server date/time configurations for backend ping tracking
SELECT NOW();

-- 3. Inventory all base public database tables to check system schemas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name ASC;

-- 4. Retrieve character listings owned by active user sessions with item value totals
SELECT 
    c.*,
    c.base_hp + COALESCE(SUM(ROUND(it.base_hp * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_hp + ii.upgrade_hp), 0)::INTEGER AS total_hp,
    c.base_atk + COALESCE(SUM(ROUND(it.base_atk * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_atk + ii.upgrade_atk), 0)::INTEGER AS total_atk,
    c.base_def + COALESCE(SUM(ROUND(it.base_def * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_def + ii.upgrade_def), 0)::INTEGER AS total_def,
    c.base_spd + COALESCE(SUM(ROUND(it.base_spd * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_spd + ii.upgrade_spd), 0)::INTEGER AS total_spd,
    c.base_eva + COALESCE(SUM(it.base_eva + ii.random_eva + ii.upgrade_eva), 0)::FLOAT AS total_eva,
    c.base_crit_rate + COALESCE(SUM(it.base_crit_rate + ii.random_crit_rate + ii.upgrade_crit_rate), 0)::FLOAT AS total_crit_rate,
    c.base_crit_dmg + COALESCE(SUM(it.base_crit_dmg + ii.random_crit_dmg + ii.upgrade_crit_dmg), 0)::FLOAT AS total_crit_dmg,
    c.base_lifesteal + COALESCE(SUM(it.base_lifesteal + ii.random_lifesteal + ii.upgrade_lifesteal), 0)::FLOAT AS total_lifesteal
FROM characters c
LEFT JOIN inventory_items ii ON c.character_id = ii.character_id AND ii.is_equipped = TRUE
LEFT JOIN item_templates it ON ii.item_template_id = it.item_template_id
WHERE c.user_id = %s GROUP BY c.character_id;

-- 5. Register a newly custom allocated character profile card row 
INSERT INTO characters (user_id, name, base_hp, current_hp, base_atk, base_def, base_spd, base_eva, base_crit_rate, base_crit_dmg, base_lifesteal, starter_skill)
VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *;

-- 6. Bind archetype-specific starter skills during character assembly 
INSERT INTO character_skills (character_id, skill_template_id) VALUES (%s, (SELECT skill_template_id FROM skill_templates WHERE name = %s));

-- 7. Load comprehensive character sheets including aggregated action skill labels
SELECT 
    c.*, COALESCE((SELECT STRING_AGG(st.name, ', ') FROM character_skills cs JOIN skill_templates st ON cs.skill_template_id = st.skill_template_id WHERE cs.character_id = c.character_id), 'None') AS active_skills,
    c.base_hp + COALESCE(SUM(ROUND(it.base_hp * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_hp + ii.upgrade_hp), 0)::INTEGER AS total_hp,
    c.base_atk + COALESCE(SUM(ROUND(it.base_atk * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_atk + ii.upgrade_atk), 0)::INTEGER AS total_atk,
    c.base_def + COALESCE(SUM(ROUND(it.base_def * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_def + ii.upgrade_def), 0)::INTEGER AS total_def,
    c.base_spd + COALESCE(SUM(ROUND(it.base_spd * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_spd + ii.upgrade_spd), 0)::INTEGER AS total_spd,
    c.base_eva + COALESCE(SUM(it.base_eva + ii.random_eva + ii.upgrade_eva), 0)::FLOAT AS total_eva,
    c.base_crit_rate + COALESCE(SUM(it.base_crit_rate + ii.random_crit_rate + ii.upgrade_crit_rate), 0)::FLOAT AS total_crit_rate,
    c.base_crit_dmg + COALESCE(SUM(it.base_crit_dmg + ii.random_crit_dmg + ii.upgrade_crit_dmg), 0)::FLOAT AS total_crit_dmg,
    c.base_lifesteal + COALESCE(SUM(it.base_lifesteal + ii.random_lifesteal + ii.upgrade_lifesteal), 0)::FLOAT AS total_lifesteal
FROM characters c LEFT JOIN inventory_items ii ON c.character_id = ii.character_id AND ii.is_equipped = TRUE LEFT JOIN item_templates it ON ii.item_template_id = it.item_template_id
WHERE c.character_id = %s GROUP BY c.character_id;

-- 8. Invalidate lingering dangling run sessions prior to spawning replacements
UPDATE game_runs SET ended_at = NOW() WHERE character_id = %s AND ended_at IS NULL;

-- 9. Spawn a fresh core run progression campaign timeline index
INSERT INTO game_runs (character_id, current_day, current_floor, current_room) VALUES (%s, 1, 1, 1) RETURNING *;

-- 10. Locate active run files to enable persistent dungeon crawler reconnect loops
SELECT * FROM game_runs WHERE character_id = %s AND ended_at IS NULL ORDER BY last_played_at DESC LIMIT 1;

-- 11. Securely track active run data mappings while validating user access keys
SELECT gr.* FROM game_runs gr JOIN characters c ON c.character_id = gr.character_id WHERE gr.run_id = %s AND c.user_id = %s AND gr.ended_at IS NULL;

-- 12. Log milestone navigation updates into historical run records
INSERT INTO run_events (run_id, event_template_id, event_result_id, floor_number, room_number) VALUES (%s, %s, %s, %s, %s);

-- 13. Process story-event rewards, handle currency additions, and resolve level ups
UPDATE characters
SET level = CASE WHEN (experience + %s) >= exp_cap THEN level + 1 ELSE level END,
    base_hp = CASE WHEN (experience + %s) >= exp_cap THEN base_hp + 15 ELSE base_hp END,
    base_atk = CASE WHEN (experience + %s) >= exp_cap THEN base_atk + 3 ELSE base_atk END,
    base_def = CASE WHEN (experience + %s) >= exp_cap THEN base_def + 2 ELSE base_def END,
    current_hp = LEAST(base_hp, current_hp + %s), current_gold = GREATEST(0, current_gold + %s),
    experience = CASE WHEN (experience + %s) >= exp_cap THEN (experience + %s) - exp_cap ELSE experience + %s END,
    exp_cap = CASE WHEN (experience + %s) >= exp_cap THEN ROUND(exp_cap * 1.5) ELSE exp_cap END,
    updated_at = CURRENT_TIMESTAMP, highest_floor_reached = GREATEST(highest_floor_reached, %s)
WHERE character_id = %s;

-- 14. Check identity records for credential collisions during account generation
SELECT user_id FROM users WHERE username = %s OR email = %s;

-- 15. Create secure server accounts maintaining crypt password signatures
INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING user_id, username, email, created_at;

-- 16. Audit raw credentials against profile tables on authentication pings
SELECT * FROM users WHERE username = %s;

-- 17. Track login event times following successful signature checking routines
UPDATE users SET last_login_at = NOW() WHERE user_id = %s;

-- 18. Retrieve full character gear item summaries containing base, random, upgrade, and resale stats
SELECT 
    ii.inventory_item_id, it.name AS item_name, it.description, it.item_type, r.rarity_name, r.hex_color, ii.is_equipped, ii.upgraded_level, e.slot AS equipped_slot,
    GREATEST(1, ROUND(COALESCE(it.sell_amount, 1) * COALESCE(r.sell_price_multiplier, 1.0)))::INTEGER AS sell_amount, ii.item_effect,
    it.base_hp AS base_item_hp, it.base_atk AS base_item_atk, it.base_def AS base_item_def, it.base_spd AS base_item_spd,
    it.base_crit_rate::FLOAT AS base_item_crit_rate, it.base_crit_dmg::FLOAT AS base_item_crit_dmg, it.base_eva::FLOAT AS base_item_eva, it.base_lifesteal::FLOAT AS base_item_lifesteal,
    ii.random_hp AS bonus_item_hp, ii.random_atk AS bonus_item_atk, ii.random_def AS bonus_item_def, ii.random_spd AS bonus_item_spd,
    ii.random_crit_rate::FLOAT AS bonus_item_crit_rate, ii.random_crit_dmg::FLOAT AS bonus_item_crit_dmg, ii.random_eva::FLOAT AS bonus_item_eva, ii.random_lifesteal::FLOAT AS bonus_item_lifesteal,
    ii.upgrade_hp AS upgrade_item_hp, ii.upgrade_atk AS upgrade_item_atk, ii.upgrade_def AS upgrade_item_def, ii.upgrade_spd AS upgrade_item_spd,
    ii.upgrade_crit_rate::FLOAT AS upgrade_item_crit_rate, ii.upgrade_crit_dmg::FLOAT AS upgrade_item_crit_dmg, ii.upgrade_eva::FLOAT AS upgrade_item_eva, ii.upgrade_lifesteal::FLOAT AS upgrade_item_lifesteal,
    (ROUND(it.base_hp * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_hp + ii.upgrade_hp)::INTEGER AS total_item_hp,
    (ROUND(it.base_atk * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_atk + ii.upgrade_atk)::INTEGER AS total_item_atk,
    (ROUND(it.base_def * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_def + ii.upgrade_def)::INTEGER AS total_item_def,
    (ROUND(it.base_spd * (1.0 + (GREATEST(ii.item_level, 1) - 1) * 0.10)) + ii.random_spd + ii.upgrade_spd)::INTEGER AS total_item_spd,
    (it.base_crit_rate + ii.random_crit_rate + ii.upgrade_crit_rate)::FLOAT AS total_item_crit_rate,
    (it.base_crit_dmg + ii.random_crit_dmg + ii.upgrade_crit_dmg)::FLOAT AS total_item_crit_dmg,
    (it.base_eva + ii.random_eva + ii.upgrade_eva)::FLOAT AS total_item_eva, (it.base_lifesteal + ii.random_lifesteal + ii.upgrade_lifesteal)::FLOAT AS total_item_lifesteal,
    CASE WHEN ii.upgraded_level >= 10 THEN NULL ELSE GREATEST(1, ROUND(COALESCE(it.sell_amount, 1) * COALESCE(r.sell_price_multiplier, 1.0) * 0.25 * POWER(1.5, ii.upgraded_level)))::INTEGER END AS upgrade_cost
FROM inventory_items ii JOIN item_templates it ON ii.item_template_id = it.item_template_id JOIN rarity r ON ii.rarity_id = r.rarity_id JOIN characters c ON ii.character_id = c.character_id LEFT JOIN equipment e ON e.inventory_item_id = ii.inventory_item_id
WHERE ii.character_id = %s AND c.user_id = %s ORDER BY ii.is_equipped DESC, r.rarity_id DESC;

-- 19. Validate character session profile permissions before editing equipment configs
SELECT character_id FROM characters WHERE character_id = %s AND user_id = %s;

-- 20. Confirm gear item type compatibility against target item slots
SELECT it.item_type FROM inventory_items ii JOIN item_templates it ON ii.item_template_id = it.item_template_id WHERE ii.inventory_item_id = %s AND ii.character_id = %s;

-- 21. Strip active flags from equipped items currently occupying the target equipment slot
UPDATE inventory_items SET is_equipped = FALSE WHERE character_id = %s AND inventory_item_id IN (SELECT inventory_item_id FROM equipment WHERE character_id = %s AND slot = %s);

-- 22. Commit equipment configurations to active tracking tables
INSERT INTO equipment (character_id, inventory_item_id, slot) VALUES (%s, %s, %s) ON CONFLICT (character_id, slot) DO UPDATE SET inventory_item_id = EXCLUDED.inventory_item_id;

-- 23. Activate tracking booleans on freshly equipped gear instances
UPDATE inventory_items SET is_equipped = TRUE WHERE inventory_item_id = %s;

-- 24. Drop item assignments out of active slot equipment matrixes during unequips
DELETE FROM equipment WHERE character_id = %s AND inventory_item_id = %s;

-- 25. Deactivate tracking booleans on unequipped item records
UPDATE inventory_items SET is_equipped = FALSE WHERE character_id = %s AND inventory_item_id = %s;

-- 26. Evaluate gear item value properties before committing vendor sell actions
SELECT ii.inventory_item_id, GREATEST(1, ROUND(COALESCE(it.sell_amount, 1) * COALESCE(r.sell_price_multiplier, 1.0)))::INTEGER AS sell_amount
FROM inventory_items ii JOIN item_templates it ON ii.item_template_id = it.item_template_id JOIN rarity r ON ii.rarity_id = r.rarity_id JOIN characters c ON ii.character_id = c.character_id
WHERE ii.inventory_item_id = %s AND ii.character_id = %s AND c.user_id = %s;

-- 27. Drop equipment linkages if a sold item was actively slotted
DELETE FROM equipment WHERE inventory_item_id = %s;

-- 28. Erase data records entirely upon completing item shop buybacks
DELETE FROM inventory_items WHERE inventory_item_id = %s AND character_id = %s;

-- 29. Refund computed liquidation values back to player balance fields
UPDATE characters SET current_gold = current_gold + %s, updated_at = CURRENT_TIMESTAMP WHERE character_id = %s;

-- 30. Clear character profile accounts and trigger drop cascades
DELETE FROM characters WHERE character_id = %s AND user_id = %s;

-- 31. Load baseline skill templates to populate core reference lists
SELECT name, description FROM skill_templates;