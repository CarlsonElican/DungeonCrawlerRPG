-- ============================================================================
-- THEME: PROGRESSION ENGINE
-- Workflow Phase: Check Level Up -> Apply Changes -> Dynamic Stat Adjustments
-- ============================================================================

-- 1. Apply EXP Gain & Evaluate Level-up Formula thresholds
UPDATE characters
SET 
    level = CASE WHEN (experience + 25) >= exp_cap THEN level + 1 ELSE level END,
    base_hp = CASE WHEN (experience + 25) >= exp_cap THEN base_hp + 15 ELSE base_hp END,
    base_atk = CASE WHEN (experience + 25) >= exp_cap THEN base_atk + 3 ELSE base_atk END,
    base_def = CASE WHEN (experience + 25) >= exp_cap THEN base_def + 2 ELSE base_def END,
    experience = CASE WHEN (experience + 25) >= exp_cap THEN (experience + 25) - exp_cap ELSE experience + 25 END,
    exp_cap = CASE WHEN (experience + 25) >= exp_cap THEN ROUND(exp_cap * 1.5) ELSE exp_cap END,
    updated_at = CURRENT_TIMESTAMP
WHERE character_id = 1;

-- 2. Rest, Full Heal, and Advance Milestones (Triggered on Boss Defeat)
UPDATE characters
SET 
    current_hp = base_hp, -- Rest and heal mechanics
    current_gold = current_gold + 100, -- Milestone bonus
    updated_at = CURRENT_TIMESTAMP
WHERE character_id = 1;