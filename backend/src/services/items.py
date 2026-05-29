from typing import Any, Dict

from src.services.scaling import item_bonus, item_decimal_bonus


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
            item_bonus(item["base_hp"], item["stat_multiplier"]),
            item_bonus(item["base_atk"], item["stat_multiplier"]),
            item_bonus(item["base_def"], item["stat_multiplier"]),
            item_bonus(item["base_spd"], item["stat_multiplier"]),
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
            r.sell_price_multiplier
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

    next_level = item["upgraded_level"] + 1
    cur.execute(
        "SELECT * FROM upgrade_rules WHERE upgrade_level = %s",
        (next_level,),
    )
    next_rule = cur.fetchone()
    if not next_rule:
        raise ValueError("Item is already at max upgrade level")

    if item["upgraded_level"] > 0:
        cur.execute(
            "SELECT * FROM upgrade_rules WHERE upgrade_level = %s",
            (item["upgraded_level"],),
        )
        previous_rule = cur.fetchone()
        previous_multiplier = previous_rule["stat_multiplier"]
    else:
        previous_multiplier = 1

    cost = max(
        1,
        round(
            max(item["sell_amount"], 1)
            * item["sell_price_multiplier"]
            * next_rule["gold_cost_multiplier"]
            * max(item["item_level"], 1)
        ),
    )
    if item["current_gold"] < cost:
        raise ValueError("Not enough gold")

    stat_delta_multiplier = next_rule["stat_multiplier"] - previous_multiplier
    hp_delta = round(item["base_hp"] * stat_delta_multiplier)
    atk_delta = round(item["base_atk"] * stat_delta_multiplier)
    def_delta = round(item["base_def"] * stat_delta_multiplier)
    spd_delta = round(item["base_spd"] * stat_delta_multiplier)
    crit_rate_delta = round(item["base_crit_rate"] * stat_delta_multiplier, 2)
    crit_dmg_delta = round(item["base_crit_dmg"] * stat_delta_multiplier, 2)
    eva_delta = round(item["base_eva"] * stat_delta_multiplier, 2)
    lifesteal_delta = round(item["base_lifesteal"] * stat_delta_multiplier, 2)

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
        """
        UPDATE inventory_items
        SET upgraded_level = %s,
            random_hp = random_hp + %s,
            random_atk = random_atk + %s,
            random_def = random_def + %s,
            random_spd = random_spd + %s,
            random_crit_rate = random_crit_rate + %s,
            random_crit_dmg = random_crit_dmg + %s,
            random_eva = random_eva + %s,
            random_lifesteal = random_lifesteal + %s
        WHERE inventory_item_id = %s
        RETURNING inventory_item_id, upgraded_level;
        """,
        (
            next_level,
            hp_delta,
            atk_delta,
            def_delta,
            spd_delta,
            crit_rate_delta,
            crit_dmg_delta,
            eva_delta,
            lifesteal_delta,
            inventory_item_id,
        ),
    )
    upgraded_item = cur.fetchone()
    return {
        "inventory_item_id": upgraded_item["inventory_item_id"],
        "upgraded_level": upgraded_item["upgraded_level"],
        "gold_spent": cost,
    }
