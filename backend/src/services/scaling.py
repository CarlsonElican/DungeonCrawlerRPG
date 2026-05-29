from decimal import Decimal
from typing import Any, Dict


def _number(value: Any) -> float:
    if isinstance(value, Decimal):
        return float(value)
    return float(value or 0)


def enemy_multiplier(floor: int, room: int) -> Dict[str, float]:
    floor_index = max(floor, 1) - 1
    room_index = max(room, 1) - 1
    return {
        "hp": 1 + (0.18 * floor_index) + (0.02 * room_index),
        "atk": 1 + (0.14 * floor_index),
        "def": 1 + (0.10 * floor_index),
        "reward": 1 + (0.15 * floor_index),
    }


def scale_enemy(enemy: Dict[str, Any], floor: int, room: int) -> Dict[str, Any]:
    multipliers = enemy_multiplier(floor, room)
    scaled_enemy = dict(enemy)
    scaled_enemy["base_hp"] = max(1, round(enemy["base_hp"] * multipliers["hp"]))
    scaled_enemy["base_atk"] = max(1, round(enemy["base_atk"] * multipliers["atk"]))
    scaled_enemy["base_def"] = max(0, round(enemy["base_def"] * multipliers["def"]))
    scaled_enemy["base_expdrop"] = max(
        1, round(enemy["base_expdrop"] * multipliers["reward"])
    )
    scaled_enemy["base_golddrop"] = max(
        0, round(enemy["base_golddrop"] * multipliers["reward"])
    )
    scaled_enemy["level"] = max(enemy["level"], floor)
    return scaled_enemy


def scale_event_result(result: Dict[str, Any], floor: int) -> Dict[str, Any]:
    reward_multiplier = 1 + (0.15 * (max(floor, 1) - 1))
    scaled_result = dict(result)
    scaled_result["gold_change"] = round(result["gold_change"] * reward_multiplier)
    scaled_result["exp_change"] = round(result["exp_change"] * reward_multiplier)
    scaled_result["hp_change"] = round(result["hp_change"] * reward_multiplier)
    return scaled_result


def shop_price(sell_amount: int, rarity_price_multiplier: Any, floor: int) -> int:
    floor_multiplier = 1 + (0.12 * (max(floor, 1) - 1))
    rarity_multiplier = _number(rarity_price_multiplier)
    rarity_base_prices = {
        1.00: 70,
        1.15: 170,
        1.35: 360,
        1.70: 750,
        2.20: 1400,
    }
    rarity_base = rarity_base_prices.get(round(rarity_multiplier, 2), 70)
    return max(
        1,
        round(
            (rarity_base + (max(sell_amount, 1) * 0.8)) * floor_multiplier
        ),
    )


def item_bonus(base_value: Any, rarity_stat_multiplier: Any) -> int:
    return round(_number(base_value) * (_number(rarity_stat_multiplier) - 1))


def item_decimal_bonus(base_value: Any, rarity_stat_multiplier: Any) -> float:
    return round(_number(base_value) * (_number(rarity_stat_multiplier) - 1), 2)
