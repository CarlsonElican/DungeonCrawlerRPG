import random
from typing import Any, Dict, List, Tuple

from src.services.scaling import item_bonus, item_decimal_bonus

MAX_UPGRADE_LEVEL = 10


def insert_inventory_item(
    cur,
    character_id: int,
    item_template_id: int,
    rarity_id: int,
    item_level: int,
    item_effect: str,
) -> Dict[str, Any]:
    cur.execute(
        """
        SELECT it.*, r.stat_multiplier
        FROM item_templates it
        CROSS JOIN rarity r
        WHERE it.item_template_id = %s
          AND r.rarity_id = %s
        """,
        (item_template_id, rarity_id),
    )
    item = cur.fetchone()
    if not item:
        raise ValueError("Item template or rarity not found")

    level_multiplier = 1.0 + (max(item_level, 1) - 1) * 0.10

    scaled_hp = float(item["base_hp"] or 0) * level_multiplier
    scaled_atk = float(item["base_atk"] or 0) * level_multiplier
    scaled_def = float(item["base_def"] or 0) * level_multiplier
    scaled_spd = float(item["base_spd"] or 0) * level_multiplier

    cur.execute(
        """
        INSERT INTO inventory_items (
            character_id,
            item_template_id,
            rarity_id,
            item_level,
            item_effect,
            random_hp,
            random_atk,
            random_def,
            random_spd,
            random_crit_rate,
            random_crit_dmg,
            random_eva,
            random_lifesteal
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING inventory_item_id;
        """,
        (
            character_id,
            item_template_id,
            rarity_id,
            item_level,
            item_effect,
            item_bonus(scaled_hp, item["stat_multiplier"]),
            item_bonus(scaled_atk, item["stat_multiplier"]),
            item_bonus(scaled_def, item["stat_multiplier"]),
            item_bonus(scaled_spd, item["stat_multiplier"]),
            item_decimal_bonus(item["base_crit_rate"], item["stat_multiplier"]),
            item_decimal_bonus(item["base_crit_dmg"], item["stat_multiplier"]),
            item_decimal_bonus(item["base_eva"], item["stat_multiplier"]),
            item_decimal_bonus(item["base_lifesteal"], item["stat_multiplier"]),
        ),
    )
    return cur.fetchone()


def upgrade_inventory_item(
    cur,
    character_id: int,
    user_id: int,
    inventory_item_id: int,
) -> Dict[str, Any]:
    cur.execute(
        """
        SELECT
            c.character_id,
            c.current_gold,
            ii.inventory_item_id,
            ii.item_level,
            ii.upgraded_level,
            it.sell_amount,
            it.base_hp,
            it.base_atk,
            it.base_def,
            it.base_spd,
            it.base_crit_rate,
            it.base_crit_dmg,
            it.base_eva,
            it.base_lifesteal,
            r.sell_price_multiplier,
            r.stat_multiplier
        FROM inventory_items ii
        JOIN characters c ON c.character_id = ii.character_id
        JOIN item_templates it ON it.item_template_id = ii.item_template_id
        JOIN rarity r ON r.rarity_id = ii.rarity_id
        WHERE ii.inventory_item_id = %s
          AND ii.character_id = %s
          AND c.user_id = %s
        """,
        (inventory_item_id, character_id, user_id),
    )
    item = cur.fetchone()
    if not item:
        raise ValueError("Inventory item not found")

    if item["upgraded_level"] >= MAX_UPGRADE_LEVEL:
        raise ValueError("Item is already at max upgrade level")

    next_level = item["upgraded_level"] + 1

    cost = max(
        1,
        round(
            max(item["sell_amount"], 1)
            * float(item["sell_price_multiplier"] or 1)
            * 0.25
            * (1.5 ** item["upgraded_level"])
        ),
    )
    if item["current_gold"] < cost:
        raise ValueError("Not enough gold")

    stat_column, stat_delta = roll_upgrade_stat(item)

    cur.execute(
        """
        UPDATE characters
        SET current_gold = current_gold - %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE character_id = %s
          AND current_gold >= %s
        """,
        (cost, character_id, cost),
    )
    if cur.rowcount != 1:
        raise ValueError("Not enough gold")

    cur.execute(
        f"""
        UPDATE inventory_items
        SET upgraded_level = %s,
            {stat_column} = {stat_column} + %s
        WHERE inventory_item_id = %s
        RETURNING inventory_item_id, upgraded_level;
        """,
        (next_level, stat_delta, inventory_item_id),
    )
    upgraded_item = cur.fetchone()
    return {
        "inventory_item_id": upgraded_item["inventory_item_id"],
        "upgraded_level": upgraded_item["upgraded_level"],
        "gold_spent": cost,
        "upgraded_stat": stat_column.replace("upgrade_", ""),
        "stat_increase": stat_delta,
    }


def roll_upgrade_stat(item: Dict[str, Any]) -> Tuple[str, float]:
    eligible_stats: List[Tuple[str, str, bool]] = [
        ("upgrade_hp", "base_hp", False),
        ("upgrade_atk", "base_atk", False),
        ("upgrade_def", "base_def", False),
        ("upgrade_spd", "base_spd", False),
        ("upgrade_crit_rate", "base_crit_rate", True),
        ("upgrade_crit_dmg", "base_crit_dmg", True),
        ("upgrade_eva", "base_eva", True),
        ("upgrade_lifesteal", "base_lifesteal", True),
    ]
    positive_stats = [stat for stat in eligible_stats if float(item[stat[1]] or 0) > 0]
    if not positive_stats:
        positive_stats = [("upgrade_hp", "base_hp", False)]

    stat_column, base_column, is_decimal = random.choice(positive_stats)
    base_value = abs(float(item[base_column] or 0))
    rarity_multiplier = float(item["stat_multiplier"] or 1)
    upgrade_factor = random.uniform(0.06, 0.14) * rarity_multiplier

    if is_decimal:
        return stat_column, max(0.01, round(base_value * upgrade_factor, 2))

    return stat_column, max(1, round(base_value * upgrade_factor))
