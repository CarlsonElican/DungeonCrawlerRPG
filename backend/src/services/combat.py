import random
from decimal import Decimal
from typing import List, Dict, Any


def safe_float(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    if isinstance(value, (int, float, Decimal)):
        return float(value)
    return default


def simulate_autobattle(
    player: Dict[str, Any], enemy: Dict[str, Any]
) -> Dict[str, Any]:
    combat_log: List[str] = []

    p_hp = player["current_hp"]
    p_max_hp = player["total_hp"]
    p_atk = player["total_atk"]
    p_def = player["total_def"]
    p_spd = player["total_spd"]
    p_eva = safe_float(player.get("total_eva"), 0.0)
    p_crit_rate = safe_float(player.get("total_crit_rate"), 0.0)
    p_crit_dmg = safe_float(player.get("total_crit_dmg"), 1.50)
    p_lifesteal = min(safe_float(player.get("total_lifesteal"), 0.0), 0.50)

    player_skill = player.get("starter_skill", "Strike")

    e_hp = enemy["base_hp"]
    e_max_hp = enemy["base_hp"]
    e_atk = enemy["base_atk"]
    e_def = enemy["base_def"]
    e_spd = enemy["base_spd"]
    e_eva = safe_float(enemy.get("base_eva"), 0.0)
    e_crit_rate = safe_float(enemy.get("base_crit_rate"), 0.0)
    e_crit_dmg = safe_float(enemy.get("base_crit_dmg"), 1.50)

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

        if player_ap >= 100 and p_hp > 0:
            player_ap -= 100
            turns_limit -= 1

            if random.random() < e_eva:
                combat_log.append(f"💨 {enemy['name']} dodged your attack!")
            else:
                mitigation = e_def * 0.05
                raw_damage = p_atk * (1 - min(0.75, mitigation))
                damage = max(1, round(raw_damage))

                is_strike_proc = False
                if player_skill == "Strike" and random.random() < 0.30:
                    damage = round(damage * 1.5)
                    is_strike_proc = True

                if random.random() < p_crit_rate:
                    damage = round(damage * p_crit_dmg)
                    combat_log.append(f"💥 {player['name']} landed a CRITICAL HIT!")

                e_hp -= damage

                if is_strike_proc:
                    log_str = f"⚡ [Strike] Triggered! {player['name']} deals {damage} heavy damage to {enemy['name']}. ({max(0, e_hp)}/{e_max_hp} HP)"
                else:
                    log_str = f"⚔️ {player['name']} deals {damage} damage to {enemy['name']}. ({max(0, e_hp)}/{e_max_hp} HP)"

                if p_lifesteal > 0:
                    healed = round(damage * p_lifesteal)
                    p_hp = min(p_max_hp, p_hp + healed)
                    log_str += f" ❤️ Life-stole +{healed} HP."

                combat_log.append(log_str)

                if player_skill == "First Aid" and random.random() < 0.25:
                    heal_proc = round(p_max_hp * 0.10)
                    p_hp = min(p_max_hp, p_hp + heal_proc)
                    combat_log.append(
                        f"🩹 [First Aid] Triggered! Recouped +{heal_proc} HP. ({p_hp}/{p_max_hp} HP)"
                    )

        if enemy_ap >= 100 and e_hp > 0:
            enemy_ap -= 100

            actual_p_eva = p_eva
            if player_skill == "Quickstep":
                actual_p_eva += 0.20

            if random.random() < actual_p_eva:
                if player_skill == "Quickstep":
                    combat_log.append(
                        f"💨 [Quickstep] Triggered! You cleanly dodged {enemy['name']}'s assault!"
                    )
                else:
                    combat_log.append(f"💨 You dodged {enemy['name']}'s attack!")
            else:
                mitigation = p_def * 0.05
                raw_damage = e_atk * (1 - min(0.75, mitigation))
                damage = max(1, round(raw_damage))

                if random.random() < e_crit_rate:
                    damage = round(damage * e_crit_dmg)
                    combat_log.append(f"💥 {enemy['name']} landed a CRITICAL HIT!")

                is_guard_proc = False
                if player_skill == "Guard" and random.random() < 0.35:
                    damage = max(1, round(damage * 0.5))
                    is_guard_proc = True

                p_hp -= damage

                if is_guard_proc:
                    combat_log.append(
                        f"🛡️ [Guard] Triggered! You absorb the blow, taking only {damage} damage! ({max(0, p_hp)}/{p_max_hp} HP)"
                    )
                else:
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
