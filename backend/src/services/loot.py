import random
from typing import Any, Dict, List


def calculate_monster_drop_multiple(
    cur, enemy_id: int, enemy_type: str
) -> List[Dict[str, Any]]:
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

    if enemy_type.lower() == "boss":
        dropped_item = random.choices(
            loot_pool,
            weights=[float(row["weight"]) for row in loot_pool],
            k=1,
        )[0]
    else:
        dropped_item = None
        for row in random.sample(loot_pool, len(loot_pool)):
            item_drop_chance = float(row["weight"]) / 100.0
            if random.random() <= item_drop_chance:
                dropped_item = row
                break

        if not dropped_item:
            return []

    chosen_rarity = random.choices(
        rarity_pool,
        weights=[float(r["weight"]) for r in rarity_pool],
        k=1,
    )[0]

    return [
        {
            "item_template_id": dropped_item["item_template_id"],
            "rarity_id": chosen_rarity["rarity_id"],
            "rarity_name": chosen_rarity["rarity_name"],
            "hex_color": chosen_rarity["hex_color"],
        }
    ]
