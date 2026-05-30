export interface User {
  user_id: number;
  username: string;
  email: string;
  created_at: string;
}

export type StarterStatKey = 'hp' | 'atk' | 'def' | 'spd' | 'eva' | 'critRate' | 'critDmg' | 'lifesteal';
export type StarterStatAllocation = Record<StarterStatKey, number>;

export interface Character {
  character_id: number;
  name: string;
  starter_skill?: string | null;
  level: number;
  experience: number;
  exp_cap: number;
  kills: number;
  deaths: number;
  current_gold: number;
  total_hp: number;
  current_hp: number;
  total_atk: number;
  total_def: number;
  total_spd: number;
  total_eva: number;
  total_crit_rate: number;
  total_crit_dmg: number;
  total_lifesteal: number;
}

export interface GameRun {
  run_id: number;
  character_id: number;
  current_day: number;
  current_floor: number;
  current_room: number;
  events_completed: number;
  events_required: number;
  boss_unlocked: boolean;
}

export interface GameEvent {
  template: {
    event_template_id: number;
    name: string;
    description: string;
    event_type: string;
  };
  result: {
    event_result_id: number;
    result_type: string;
    notes: string;
    enemy_id?: number;
    enemy_name?: string;
    enemy_hp?: number;
  };
}

export interface CombatResult {
  victory: boolean;
  gold_earned: number;
  exp_earned: number;
  level_up_triggered: boolean;
  combat_log: string[];
  run?: GameRun;
  character?: Character;
}

export interface ShopOffer {
  run_shop_offer_id?: number;
  item_template_id: number;
  item_name: string;
  description?: string | null;
  item_type: string;
  rarity_id: number;
  rarity_name: string;
  hex_color: string;
  dynamic_gold_cost: number;
  item_effect?: string | null;
  base_item_hp: number;
  base_item_atk: number;
  base_item_def: number;
  base_item_spd: number;
  base_item_crit_rate: number;
  base_item_crit_dmg: number;
  base_item_eva: number;
  base_item_lifesteal: number;
  bonus_item_hp: number;
  bonus_item_atk: number;
  bonus_item_def: number;
  bonus_item_spd: number;
  bonus_item_crit_rate: number;
  bonus_item_crit_dmg: number;
  bonus_item_eva: number;
  bonus_item_lifesteal: number;
  total_item_hp: number;
  total_item_atk: number;
  total_item_def: number;
  total_item_spd: number;
  total_item_crit_rate: number;
  total_item_crit_dmg: number;
  total_item_eva: number;
  total_item_lifesteal: number;
  upgrade_cost: number | null;
}

export interface InventoryItem {
  inventory_item_id: number;
  item_name: string;
  description?: string | null;
  item_type: string;
  rarity_name: string;
  hex_color: string;
  is_equipped: boolean;
  upgraded_level: number;
  equipped_slot?: string | null;
  sell_amount: number;
  item_effect?: string | null;
  base_item_hp: number;
  base_item_atk: number;
  base_item_def: number;
  base_item_spd: number;
  base_item_crit_rate: number;
  base_item_crit_dmg: number;
  base_item_eva: number;
  base_item_lifesteal: number;
  bonus_item_hp: number;
  bonus_item_atk: number;
  bonus_item_def: number;
  bonus_item_spd: number;
  bonus_item_crit_rate: number;
  bonus_item_crit_dmg: number;
  bonus_item_eva: number;
  bonus_item_lifesteal: number;
  upgrade_item_hp: number;
  upgrade_item_atk: number;
  upgrade_item_def: number;
  upgrade_item_spd: number;
  upgrade_item_crit_rate: number;
  upgrade_item_crit_dmg: number;
  upgrade_item_eva: number;
  upgrade_item_lifesteal: number;
  total_item_hp: number;
  total_item_atk: number;
  total_item_def: number;
  total_item_spd: number;
  total_item_crit_rate: number;
  total_item_crit_dmg: number;
  total_item_eva: number;
  total_item_lifesteal: number;
  upgrade_cost: number | null;
}

export interface EventCompletionResult {
  message: string;
  run: GameRun;
  character: Character;
}

export interface UpgradeResult {
  message: string;
  inventory_item_id: number;
  upgraded_level: number;
  gold_spent: number;
  upgraded_stat: string;
  stat_increase: number;
  character: Character;
}
