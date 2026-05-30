import random
from typing import Any, Dict, List


def calculate_monster_drop_multiple(
    cur, enemy_id: int, enemy_type: str
) -> List[Dict[str, Any]]:
    dropped_items = []

    cur.execute(
        """
        SELECT item_template_id, weight 
        FROM loot_table 
        WHERE enemy_id = %s
        """,
        (enemy_id,),
    )
    loot_pool = cur.fetchall()
    if not loot_pool:
        return []

    cur.execute("SELECT rarity_id, rarity_name, hex_color, weight FROM rarity")
    rarity_pool = cur.fetchall()

    global_drop_modifier = 2.0 if enemy_type.lower() == "boss" else 1.0

    for row in loot_pool:
        item_drop_chance = (float(row["weight"]) / 100.0) * global_drop_modifier

        if random.random() <= item_drop_chance:
            chosen_rarity = random.choices(
                rarity_pool,
                weights=[float(r["weight"]) for r in rarity_pool],
                k=1,
            )[0]

            dropped_items.append(
                {
                    "item_template_id": row["item_template_id"],
                    "rarity_id": chosen_rarity["rarity_id"],
                    "rarity_name": chosen_rarity["rarity_name"],
                    "hex_color": chosen_rarity["hex_color"],
                }
            )

    return dropped_items
