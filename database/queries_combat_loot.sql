-- ============================================================================
-- THEME: COMBAT LOOP & LOOT TABLES
-- Workflow Phase: Generate Room Event -> Run Turn-Based Combat -> Roll Loot Table
-- ============================================================================

-- 1. Fetch active enemy stats and their potential loot drops
SELECT 
    e.enemy_id,
    e.name AS enemy_name,
    e.base_hp,
    e.base_atk,
    e.base_def,
    e.base_spd,
    e.base_crit_rate,
    e.base_crit_dmg,
    e.base_lifesteal,
    e.base_expdrop,
    e.base_golddrop,
    it.item_template_id,
    it.name AS item_name,
    it.item_type,
    lt.weight AS drop_weight
FROM enemies e
LEFT JOIN loot_table lt ON e.enemy_id = lt.enemy_id
LEFT JOIN item_templates it ON lt.item_template_id = it.item_template_id
WHERE e.name = 'Goblin Thief'; -- Dynamically pass enemy name during combat init

-- 2. Roll Weighted Loot Drop (Combines Enemy Drop Rates + Global Rarity Odds)
-- Uses random weight distribution across available matching cross-joined entries
SELECT 
    lt.item_template_id,
    it.name AS item_name,
    r.rarity_id,
    r.rarity_name,
    r.hex_color,
    ROUND(it.base_atk * r.stat_multiplier) AS final_atk,
    ROUND(it.base_def * r.stat_multiplier) AS final_def,
    ROUND(it.base_hp * r.stat_multiplier) AS final_hp,
    ROUND(it.base_spd * r.stat_multiplier) AS final_spd,
    it.item_effect
FROM loot_table lt
JOIN item_templates it ON lt.item_template_id = it.item_template_id
CROSS JOIN rarity r
WHERE lt.enemy_id = 2 -- Example: Dropped from Goblin Thief
ORDER BY (random() * lt.weight * r.weight) DESC
LIMIT 1;

-- 3. Add Dropped Item to Player Inventory
INSERT INTO inventory_items (
    character_id, item_template_id, rarity_id, item_level, 
    item_effect, is_equipped, upgraded_level, 
    random_hp, random_atk, random_def, random_spd
) VALUES (1, 3, 2, 1, 'Increases speed', FALSE, 0, 0, 0, 0, 2);