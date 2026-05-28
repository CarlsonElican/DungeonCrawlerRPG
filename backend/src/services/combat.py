import random
from typing import List, Dict, Any


def simulate_autobattle(
    player: Dict[str, Any], enemy: Dict[str, Any]
) -> Dict[str, Any]:
    combat_log: List[str] = []

    p_hp = player["current_hp"]
    p_max_hp = player["total_hp"]
    p_atk = player["total_atk"]
    p_def = player["total_def"]
    p_spd = player["total_spd"]
    p_eva = player["total_eva"]
    p_crit_rate = player["total_crit_rate"]
    p_crit_dmg = player["total_crit_dmg"]
    p_lifesteal = min(player["total_lifesteal"], 0.50)

    e_hp = enemy["base_hp"]
    e_max_hp = enemy["base_hp"]
    e_atk = enemy["base_atk"]
    e_def = enemy["base_def"]
    e_spd = enemy["base_spd"]
    e_eva = enemy["base_eva"]

    player_ap = 0
    enemy_ap = 0

    combat_log.append(
        f"⚔️ Battle started! {player['name']} vs {enemy['name']} (Lv. {enemy['level']})"
    )

    if p_spd <= 0:
        p_spd = 1
    if e_spd <= 0:
        e_spd = 1

    turns_limit = 100
    while p_hp > 0 and e_hp > 0 and turns_limit > 0:
        player_ap += p_spd
        enemy_ap += e_spd

        # --- PLAYER TURN ---
        if player_ap >= 100 and p_hp > 0:
            player_ap -= 100
            turns_limit -= 1

            if random.random() < e_eva:
                combat_log.append(f"💨 {enemy['name']} dodged your attack!")
            else:
                mitigation = e_def * 0.05
                raw_damage = p_atk * (1 - min(0.75, mitigation))
                damage = max(1, round(raw_damage))

                if random.random() < p_crit_rate:
                    damage = round(damage * p_crit_dmg)
                    combat_log.append(f"💥 CRITICAL HIT!")

                e_hp -= damage
                log_str = f"⚔️ {player['name']} deals {damage} damage to {enemy['name']}. ({max(0, e_hp)}/{e_max_hp} HP)"

                if p_lifesteal > 0:
                    healed = round(damage * p_lifesteal)
                    p_hp = min(p_max_hp, p_hp + healed)
                    log_str += f" ❤️ Life-stole +{healed} HP."

                combat_log.append(log_str)

        # --- ENEMY TURN ---
        if enemy_ap >= 100 and e_hp > 0:
            enemy_ap -= 100

            if random.random() < p_eva:
                combat_log.append(f"💨 You dodged {enemy['name']}'s attack!")
            else:
                mitigation = p_def * 0.05
                raw_damage = e_atk * (1 - min(0.75, mitigation))
                damage = max(1, round(raw_damage))

                p_hp -= damage
                combat_log.append(
                    f"🩸 {enemy['name']} hits you for {damage} damage! ({max(0, p_hp)}/{p_max_hp} HP)"
                )

    victory = p_hp > 0
    return {
        "victory": victory,
        "player_final_hp": max(0, p_hp),
        "enemy_final_hp": max(0, e_hp),
        "log": combat_log,
    }
