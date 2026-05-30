-- ============================================================================
-- THEME: INVENTORY & EQUIPMENT SYSTEM
-- Workflow Phase: View Inventory -> Equip/Unequip Gear -> Recalculate Sheets
-- ============================================================================

-- 1. Get Character's True Dynamic Stats (Base Stats + Sum of All Equipped Items)
SELECT 
    c.character_id,
    c.name,
    c.level,
    c.base_hp + COALESCE(SUM(it.base_hp + ii.random_hp + ii.upgrade_hp), 0) AS total_hp,
    c.base_atk + COALESCE(SUM(it.base_atk + ii.random_atk + ii.upgrade_atk), 0) AS total_atk,
    c.base_def + COALESCE(SUM(it.base_def + ii.random_def + ii.upgrade_def), 0) AS total_def,
    c.base_spd + COALESCE(SUM(it.base_spd + ii.random_spd + ii.upgrade_spd), 0) AS total_spd,
    c.base_crit_rate + COALESCE(SUM(it.base_crit_rate), 0) AS total_crit_rate,
    c.base_crit_dmg + COALESCE(SUM(it.base_crit_dmg), 0) AS total_crit_dmg,
    c.base_lifesteal + COALESCE(SUM(it.base_lifesteal), 0) AS total_lifesteal
FROM characters c
LEFT JOIN inventory_items ii ON c.character_id = ii.character_id AND ii.is_equipped = TRUE
LEFT JOIN item_templates it ON ii.item_template_id = it.item_template_id
WHERE c.character_id = 1
GROUP BY c.character_id, c.name, c.level, c.base_hp, c.base_atk, c.base_def, c.base_spd, c.base_crit_rate, c.base_crit_dmg, c.base_lifesteal;

-- 2. Fetch Detailed Inventory View with Stats Grouped by Rarity Theme
SELECT 
    ii.id AS inventory_item_id,
    it.name AS item_name,
    it.item_type,
    r.rarity_name,
    r.hex_color,
    ii.is_equipped,
    (it.base_atk + ii.random_atk + ii.upgrade_atk) AS total_item_atk,
    (it.base_def + ii.random_def + ii.upgrade_def) AS total_item_def,
    it.item_effect
FROM inventory_items ii
JOIN item_templates it ON ii.item_template_id = it.item_template_id
JOIN rarity r ON ii.rarity_id = r.rarity_id
WHERE ii.character_id = 1
ORDER BY ii.is_equipped DESC, r.rarity_id DESC;

-- 3. Atomically Equip an Item (Handles Slot Swapping Safely)
-- Step A: Unequip old item in that slot
UPDATE inventory_items
SET is_equipped = FALSE
WHERE character_id = 1 
  AND id IN (SELECT inventory_item_id FROM equipment WHERE character_id = 1 AND slot = 'Weapon');

-- Step B: Upsert equipment slot mapper
INSERT INTO equipment (character_id, inventory_item_id, slot)
VALUES (1, 3, 'Weapon')
ON CONFLICT (character_id, slot) 
DO UPDATE SET inventory_item_id = EXCLUDED.inventory_item_id;

-- Step C: Flag new item as equipped
UPDATE inventory_items
SET is_equipped = TRUE
WHERE id = 3;
