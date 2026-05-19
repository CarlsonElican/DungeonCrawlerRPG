-- ============================================================================
-- THEME: DYNAMIC SHOP SYSTEM
-- Workflow Phase: Visit Shop Screen -> Generate Offers -> Purchase Item
-- ============================================================================

-- 1. Load Day-Specific Shop Offers with Prices Scaled by Rarity Multipliers
SELECT 
    so.item_template_id,
    it.name AS item_name,
    it.item_type,
    r.rarity_id,
    r.rarity_name,
    r.hex_color,
    ROUND(so.price * r.sell_price_multiplier) AS dynamic_gold_cost,
    it.item_effect
FROM shop_offer so
JOIN item_templates it ON so.item_template_id = it.item_template_id
JOIN rarity r ON so.rarity_id = r.rarity_id
WHERE so.day_number = 1; -- Filter dynamically using active session run-day

-- 2. Process an Item Purchase Transaction
-- Docks player gold if they can afford it (Enforce gold floor in API)
UPDATE characters
SET current_gold = current_gold - 35
WHERE character_id = 1 AND current_gold >= 35;