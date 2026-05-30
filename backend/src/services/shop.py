from typing import Any, Dict, List

from src.services.items import insert_inventory_item
from src.services.scaling import shop_price


def _offer_select_sql(where_clause: str) -> str:
    return f"""
        SELECT
            rso.run_shop_offer_id,
            it.item_template_id,
            it.name AS item_name,
            it.description,
            it.item_type,
            r.rarity_id,
            r.rarity_name,
            r.hex_color,
            rso.price AS dynamic_gold_cost,
            NULL::TEXT AS item_effect,
            
            it.base_hp AS base_item_hp,
            it.base_atk AS base_item_atk,
            it.base_def AS base_item_def,
            it.base_spd AS base_item_spd,
            it.base_crit_rate::FLOAT AS base_item_crit_rate,
            it.base_crit_dmg::FLOAT AS base_item_crit_dmg,
            it.base_eva::FLOAT AS base_item_eva,
            it.base_lifesteal::FLOAT AS base_item_lifesteal,
            
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
        FROM run_shop_offers rso
        JOIN item_templates it ON it.item_template_id = rso.item_template_id
        JOIN rarity r ON r.rarity_id = rso.rarity_id
        {where_clause}
        ORDER BY r.rarity_id DESC, it.name;
    """


def get_or_create_shop_offers(
    cur, run: Dict[str, Any], offer_count: int = 4
) -> List[Dict[str, Any]]:
    cur.execute(
        _offer_select_sql("""
            WHERE rso.run_id = %s
              AND rso.floor_number = %s
              AND rso.room_number = %s
              AND rso.purchased_at IS NULL
            """),
        (run["run_id"], run["current_floor"], run["current_room"]),
    )
    existing_offers = cur.fetchall()
    if existing_offers:
        return existing_offers

    cur.execute(
        "SELECT * FROM item_templates ORDER BY RANDOM() LIMIT %s", (offer_count,)
    )
    templates = cur.fetchall()

    for template in templates:
        cur.execute("""
            SELECT *
            FROM rarity
            ORDER BY (-LN(GREATEST(RANDOM(), 0.000001)) / NULLIF(weight, 0))
            LIMIT 1
            """)
        rarity = cur.fetchone()
        price = shop_price(
            template["sell_amount"],
            rarity["sell_price_multiplier"],
            run["current_floor"],
        )
        cur.execute(
            """
            INSERT INTO run_shop_offers (
                run_id,
                floor_number,
                room_number,
                item_template_id,
                rarity_id,
                price
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (
                run["run_id"],
                run["current_floor"],
                run["current_room"],
                template["item_template_id"],
                rarity["rarity_id"],
                price,
            ),
        )

    cur.execute(
        _offer_select_sql("""
            WHERE rso.run_id = %s
              AND rso.floor_number = %s
              AND rso.room_number = %s
              AND rso.purchased_at IS NULL
            """),
        (run["run_id"], run["current_floor"], run["current_room"]),
    )
    return cur.fetchall()


def purchase_shop_offer(
    cur,
    run: Dict[str, Any],
    character: Dict[str, Any],
    item_template_id: int = None,
    rarity_id: int = None,
    run_shop_offer_id: int = None,
) -> Dict[str, Any]:
    if run_shop_offer_id is not None:
        cur.execute(
            """
            SELECT *
            FROM run_shop_offers
            WHERE run_shop_offer_id = %s
              AND run_id = %s
              AND floor_number = %s
              AND room_number = %s
              AND purchased_at IS NULL
            """,
            (
                run_shop_offer_id,
                run["run_id"],
                run["current_floor"],
                run["current_room"],
            ),
        )
    else:
        cur.execute(
            """
            SELECT *
            FROM run_shop_offers
            WHERE run_id = %s
              AND floor_number = %s
              AND room_number = %s
              AND item_template_id = %s
              AND rarity_id = %s
              AND purchased_at IS NULL
            ORDER BY run_shop_offer_id
            LIMIT 1
            """,
            (
                run["run_id"],
                run["current_floor"],
                run["current_room"],
                item_template_id,
                rarity_id,
            ),
        )
    offer = cur.fetchone()
    if not offer:
        raise ValueError("Shop item not found")
    if character["current_gold"] < offer["price"]:
        raise ValueError("Not enough gold")

    cur.execute(
        """
        UPDATE characters
        SET current_gold = current_gold - %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE character_id = %s
          AND current_gold >= %s
        """,
        (offer["price"], character["character_id"], offer["price"]),
    )
    if cur.rowcount != 1:
        raise ValueError("Not enough gold")

    inventory_item = insert_inventory_item(
        cur,
        character["character_id"],
        offer["item_template_id"],
        offer["rarity_id"],
        run["current_floor"],
        "Purchased from merchant",
    )

    cur.execute(
        """
        UPDATE run_shop_offers
        SET purchased_at = NOW()
        WHERE run_shop_offer_id = %s
        """,
        (offer["run_shop_offer_id"],),
    )

    return {
        "inventory_item_id": inventory_item["inventory_item_id"],
        "gold_spent": offer["price"],
    }
