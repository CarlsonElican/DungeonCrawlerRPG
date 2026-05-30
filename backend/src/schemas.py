from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class CharacterBase(BaseModel):
    name: str
    base_hp: int
    base_atk: int
    base_def: int
    base_spd: int
    base_eva: float = 0.0
    base_crit_rate: float = 0.05
    base_crit_dmg: float = 1.5
    base_lifesteal: float = 0.0
    starter_skill: Optional[str] = None


class CharacterCreate(CharacterBase):
    pass


class CharacterResponse(CharacterBase):
    character_id: int
    level: int
    experience: int
    exp_cap: int
    kills: int
    deaths: int
    current_gold: int
    current_hp: int
    highest_floor_reached: int
    total_hp: int
    total_atk: int
    total_def: int
    total_spd: int
    total_eva: float
    total_crit_rate: float
    total_crit_dmg: float
    total_lifesteal: float

    class Config:
        from_attributes = True


class GameRunResponse(BaseModel):
    run_id: int
    character_id: int
    current_day: int
    current_floor: int
    current_room: int
    events_completed: int
    events_required: int
    boss_unlocked: bool


class EventCompletionRequest(BaseModel):
    event_template_id: int
    event_result_id: int


class EventCompletionResponse(BaseModel):
    message: str
    run: GameRunResponse
    character: CharacterResponse


class InventoryItemResponse(BaseModel):
    inventory_item_id: int
    item_name: str
    description: Optional[str]
    item_type: str
    rarity_name: str
    hex_color: str
    is_equipped: bool
    upgraded_level: int
    equipped_slot: Optional[str]
    sell_amount: int
    item_effect: Optional[str]
    base_item_hp: int
    base_item_atk: int
    base_item_def: int
    base_item_spd: int
    base_item_crit_rate: float
    base_item_crit_dmg: float
    base_item_eva: float
    base_item_lifesteal: float
    bonus_item_hp: int
    bonus_item_atk: int
    bonus_item_def: int
    bonus_item_spd: int
    bonus_item_crit_rate: float
    bonus_item_crit_dmg: float
    bonus_item_eva: float
    bonus_item_lifesteal: float
    upgrade_item_hp: int
    upgrade_item_atk: int
    upgrade_item_def: int
    upgrade_item_spd: int
    upgrade_item_crit_rate: float
    upgrade_item_crit_dmg: float
    upgrade_item_eva: float
    upgrade_item_lifesteal: float
    total_item_hp: int
    total_item_atk: int
    total_item_def: int
    total_item_spd: int
    total_item_crit_rate: float
    total_item_crit_dmg: float
    total_item_eva: float
    total_item_lifesteal: float
    upgrade_cost: Optional[int]


class EquipItemRequest(BaseModel):
    inventory_item_id: int
    slot: str


class InventoryItemActionRequest(BaseModel):
    inventory_item_id: int


class ShopOfferResponse(BaseModel):
    run_shop_offer_id: Optional[int] = None
    item_template_id: int
    item_name: str
    description: Optional[str]
    item_type: str
    rarity_id: int
    rarity_name: str
    hex_color: str
    dynamic_gold_cost: int
    item_effect: Optional[str]
    base_item_hp: int
    base_item_atk: int
    base_item_def: int
    base_item_spd: int
    base_item_crit_rate: float
    base_item_crit_dmg: float
    base_item_eva: float
    base_item_lifesteal: float
    bonus_item_hp: int
    bonus_item_atk: int
    bonus_item_def: int
    bonus_item_spd: int
    bonus_item_crit_rate: float
    bonus_item_crit_dmg: float
    bonus_item_eva: float
    bonus_item_lifesteal: float
    total_item_hp: int
    total_item_atk: int
    total_item_def: int
    total_item_spd: int
    total_item_crit_rate: float
    total_item_crit_dmg: float
    total_item_eva: float
    total_item_lifesteal: float


class ShopPurchaseRequest(BaseModel):
    item_template_id: Optional[int] = None
    rarity_id: Optional[int] = None
    run_shop_offer_id: Optional[int] = None


class UpgradeItemResponse(BaseModel):
    message: str
    inventory_item_id: int
    upgraded_level: int
    gold_spent: int
    upgraded_stat: str
    stat_increase: float
    character: CharacterResponse


class EventTemplateResponse(BaseModel):
    event_template_id: int
    name: str
    event_type: str
    description: str


class EventResultResponse(BaseModel):
    event_result_id: int
    result_type: str
    notes: str
    # We don't necessarily want to spoil the stat changes to the UI before it happens


class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class CombatInitiativeRequest(BaseModel):
    event_template_id: int


class CombatResponse(BaseModel):
    victory: bool
    player_final_hp: int
    enemy_final_hp: int
    gold_earned: int
    exp_earned: int
    level_up_triggered: bool
    combat_log: List[str]
    run: Optional[GameRunResponse] = None
    character: Optional[CharacterResponse] = None
