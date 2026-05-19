-- Simulated seed data for the Dungeon Crawler RPG game.

INSERT INTO users (username, email, password_hash, last_login_at)
VALUES
    ('test_player', 'test_player@example.com', 'hashed_password_1', CURRENT_TIMESTAMP),
    ('demo_mage', 'demo_mage@example.com', 'hashed_password_2', CURRENT_TIMESTAMP);

INSERT INTO characters (
    user_id,
    name,
    level,
    experience,
    exp_cap,
    current_hp,
    current_gold,
    base_hp,
    base_atk,
    base_def,
    base_spd,
    base_crit_rate,
    base_crit_dmg,
    base_eva,
    base_lifesteal,
    starter_skill
)
VALUES
    (1, 'Arden', 1, 0, 100, 120, 35, 120, 14, 8, 10, 5.00, 1.50, 3.00, 0.00, 'Power Strike'),
    (2, 'Lyra', 1, 25, 100, 90, 50, 90, 18, 5, 14, 8.00, 1.60, 6.00, 0.00, 'Arcane Bolt');

INSERT INTO rarity (rarity_name, stat_multiplier, sell_price_multiplier, weight, hex_color)
VALUES
    ('Common', 1.00, 1.00, 60.00, '#FFFFFF'),
    ('Uncommon', 1.15, 1.25, 25.00, '#1EFF00'),
    ('Rare', 1.35, 1.75, 10.00, '#0070DD'),
    ('Epic', 1.65, 2.50, 4.00, '#A335EE'),
    ('Legendary', 2.00, 4.00, 1.00, '#FF8000');

INSERT INTO item_templates (
    name,
    description,
    item_type,
    base_hp,
    base_atk,
    base_def,
    base_spd,
    base_crit_rate,
    base_crit_dmg,
    base_eva,
    base_lifesteal,
    sell_amount
)
VALUES
    ('Iron Sword', 'A basic sword used by new adventurers.', 'Weapon', 0, 6, 0, 0, 1.00, 0.00, 0.00, 0.00, 12),
    ('Leather Armor', 'Light armor that offers basic protection.', 'Armor', 15, 0, 4, 0, 0.00, 0.00, 1.00, 0.00, 10),
    ('Swift Boots', 'Boots that help the wearer move faster.', 'Boots', 0, 0, 1, 4, 0.00, 0.00, 2.00, 0.00, 9),
    ('Vampiric Ring', 'A ring that restores a small amount of health after attacks.', 'Accessory', 0, 2, 0, 0, 0.00, 0.00, 0.00, 2.00, 20),
    ('Health Potion', 'Restores health when used.', 'Consumable', 25, 0, 0, 0, 0.00, 0.00, 0.00, 0.00, 5);

INSERT INTO inventory_items (
    character_id,
    item_template_id,
    rarity_id,
    item_level,
    item_effect,
    is_equipped,
    upgraded_level,
    random_hp,
    random_atk,
    random_def,
    random_spd
)
VALUES
    (1, 1, 1, 1, 'Starter weapon', TRUE, 0, 0, 1, 0, 0),
    (1, 2, 1, 1, 'Starter armor', TRUE, 0, 2, 0, 1, 0),
    (1, 5, 1, 1, 'Restores 25 HP', FALSE, 0, 0, 0, 0, 0),
    (2, 3, 2, 1, 'Increases speed', TRUE, 0, 0, 0, 0, 2),
    (2, 4, 3, 2, 'Adds lifesteal', TRUE, 1, 0, 2, 0, 0);

INSERT INTO equipment (character_id, inventory_item_id, slot)
VALUES
    (1, 1, 'Weapon'),
    (1, 2, 'Armor'),
    (2, 4, 'Accessory'),
    (2, 5, 'Ring');

INSERT INTO enemies (
    name,
    type,
    level,
    base_hp,
    base_atk,
    base_def,
    base_spd,
    base_crit_rate,
    base_crit_dmg,
    base_eva,
    base_lifesteal,
    base_expdrop,
    base_golddrop
)
VALUES
    ('Cave Slime', 'Slime', 1, 35, 5, 2, 3, 1.00, 1.25, 0.00, 0.00, 12, 8),
    ('Skeleton Guard', 'Undead', 2, 55, 9, 5, 5, 3.00, 1.40, 2.00, 0.00, 22, 14),
    ('Goblin Cutthroat', 'Humanoid', 3, 70, 12, 4, 9, 6.00, 1.50, 5.00, 0.00, 32, 20),
    ('Crypt Warden', 'Boss', 5, 180, 22, 12, 7, 8.00, 1.75, 3.00, 1.00, 100, 75);

INSERT INTO loot_table (enemy_id, item_template_id, weight)
VALUES
    (1, 5, 50.00),
    (1, 1, 15.00),
    (2, 2, 25.00),
    (2, 5, 35.00),
    (3, 3, 20.00),
    (4, 4, 10.00);

INSERT INTO shop_offer (item_template_id, rarity_id, day_number, price)
VALUES
    (5, 1, 1, 12),
    (1, 2, 1, 35),
    (2, 2, 1, 30),
    (3, 3, 2, 55),
    (4, 3, 3, 90);

INSERT INTO game_runs (
    character_id,
    current_day,
    current_floor,
    current_room,
    events_completed,
    events_required,
    boss_unlocked,
    max_gold_earned
)
VALUES
    (1, 1, 1, 4, 3, 5, FALSE, 35),
    (2, 1, 1, 2, 1, 5, FALSE, 50);

INSERT INTO event_templates (name, event_type, description)
VALUES
    ('Slime Ambush', 'Combat', 'A slime drops from the ceiling and attacks.'),
    ('Abandoned Chest', 'Treasure', 'A locked chest sits in the corner of the room.'),
    ('Healing Fountain', 'Rest', 'A glowing fountain restores some health.'),
    ('Dark Shrine', 'Risk', 'A shrine offers power at a health cost.'),
    ('Merchant Camp', 'Shop', 'A traveling merchant offers items for sale.');

INSERT INTO event_results (result_type, gold_change, hp_change, exp_change, notes)
VALUES
    ('Victory', 12, -8, 15, 'Defeated the enemy and gained rewards.'),
    ('Treasure Found', 25, 0, 5, 'Opened a chest and found gold.'),
    ('Healed', 0, 20, 0, 'Recovered health from a fountain.'),
    ('Cursed Reward', 40, -15, 20, 'Accepted a dangerous shrine reward.'),
    ('Failed Trap', -5, -10, 0, 'Triggered a trap and lost some gold.');

INSERT INTO run_events (
    run_id,
    event_template_id,
    event_result_id,
    floor_number,
    room_number,
    sequence_number
)
VALUES
    (1, 1, 1, 1, 1, 1),
    (1, 2, 2, 1, 2, 2),
    (1, 3, 3, 1, 3, 3),
    (2, 5, 2, 1, 1, 1);
