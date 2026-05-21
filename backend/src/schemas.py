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
    user_id: int

class CharacterResponse(CharacterBase):
    character_id: int
    level: int
    experience: int
    exp_cap: int
    kills: int
    deaths: int
    current_gold: int
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

class InventoryItemResponse(BaseModel):
    inventory_item_id: int
    item_name: str
    item_type: str
    rarity_name: str
    hex_color: str
    is_equipped: bool
    total_item_atk: int
    total_item_def: int
    item_effect: Optional[str]

class EquipItemRequest(BaseModel):
    inventory_item_id: int
    slot: str

class ShopOfferResponse(BaseModel):
    item_template_id: int
    item_name: str
    item_type: str
    rarity_id: int
    rarity_name: str
    hex_color: str
    dynamic_gold_cost: int
    item_effect: Optional[str]

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