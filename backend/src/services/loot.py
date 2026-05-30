import random
from typing import Any, Dict


def calculate_monster_drop(
    cur, enemy_id: int, enemy_type: str
) -> Dict[str, Any] | None:
    drop_chance = 1.00 if enemy_type.lower() == "boss" else 0.40
    if random.random() > drop_chance:
        return None

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
        return None

    item_templates = [row["item_template_id"] for row in loot_pool]
    item_weights = [float(row["weight"]) for row in loot_pool]
    chosen_template_id = random.choices(item_templates, weights=item_weights, k=1)[0]

    cur.execute("SELECT rarity_id, weight FROM rarity")
    rarity_pool = cur.fetchall()
    if not rarity_pool:
        raise ValueError("Rarity pool database records are completely empty.")

    rarity_ids = [row["rarity_id"] for row in rarity_pool]
    rarity_weights = [float(row["weight"]) for row in rarity_pool]
    chosen_rarity_id = random.choices(rarity_ids, weights=rarity_weights, k=1)[0]

    return {"item_template_id": chosen_template_id, "rarity_id": chosen_rarity_id}
