from typing import Any, Dict, Optional


def fetch_character_sheet(cur, character_id: int) -> Optional[Dict[str, Any]]:
    cur.execute(
        """
        SELECT
            c.*,
            c.base_hp + COALESCE(SUM(it.base_hp + ii.random_hp), 0) AS total_hp,
            c.base_atk + COALESCE(SUM(it.base_atk + ii.random_atk), 0) AS total_atk,
            c.base_def + COALESCE(SUM(it.base_def + ii.random_def), 0) AS total_def,
            c.base_spd + COALESCE(SUM(it.base_spd + ii.random_spd), 0) AS total_spd,
            c.base_eva + COALESCE(SUM(it.base_eva), 0) AS total_eva,
            c.base_crit_rate + COALESCE(SUM(it.base_crit_rate), 0) AS total_crit_rate,
            c.base_crit_dmg + COALESCE(SUM(it.base_crit_dmg), 0) AS total_crit_dmg,
            c.base_lifesteal + COALESCE(SUM(it.base_lifesteal), 0) AS total_lifesteal
        FROM characters c
        LEFT JOIN inventory_items ii ON c.character_id = ii.character_id AND ii.is_equipped = TRUE
        LEFT JOIN item_templates it ON ii.item_template_id = it.item_template_id
        WHERE c.character_id = %s
        GROUP BY c.character_id;
        """,
        (character_id,),
    )
    return cur.fetchone()
