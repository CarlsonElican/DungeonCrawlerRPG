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

INSERT INTO rarity (rarity_id, rarity_name, stat_multiplier, sell_price_multiplier, weight, hex_color) VALUES
(1, 'Common', 1.00, 1.00, 60.00, '#FFFFFF'),
(2, 'Uncommon', 1.25, 1.10, 25.00, '#32CD32'),
(3, 'Rare', 1.50, 1.25, 10.00, '#0000FF'),
(4, 'Epic', 2.00, 1.50, 4.00, '#7F00FF'),
(5, 'Legendary', 2.50, 2.00, 1.00, '#FF0000');


INSERT INTO loot_table (enemy_id, item_template_id, weight)
VALUES
    -- Frail Skeleton (ID 1) Drops
    (1, 1, 70.00), -- Frail Skeleton -> Rusty Sword
    (1, 5, 40.00), -- Frail Skeleton -> Battered Wooden Shield
    (1, 8, 30.00), -- Frail Skeleton -> Ragged Hood

    -- Goblin Thief (ID 2) Drops
    (2, 3, 50.00), -- Goblin Thief -> Assassin's Dagger
    (2, 10, 50.00), -- Goblin Thief -> Tattered Cloth Garb
    (2, 17, 10.00), -- Goblin Thief -> Gold Ring of Greed

    -- Vampiric Bat (ID 3) Drops
    (3, 8, 60.00), -- Vampiric Bat -> Ragged Hood
    (3, 18, 15.00), -- Vampiric Bat -> Vampire's Amulet

    -- Slime Blob (ID 4) Drops
    (4, 1, 60.00), -- Slime Blob -> Rusty Sword
    (4, 5, 50.00), -- Slime Blob -> Battered Wooden Shield

    -- Dungeon Rat (ID 5) Drops
    (5, 8, 50.00), -- Dungeon Rat -> Ragged Hood
    (5, 10, 50.00), -- Dungeon Rat -> Tattered Cloth Garb

    -- Zombie Wanderer (ID 6) Drops
    (6, 1, 40.00), -- Zombie Wanderer -> Rusty Sword
    (6, 13, 40.00), -- Zombie Wanderer -> Leather Greaves

    -- Orc Berserker (ID 7) Drops
    (7, 2, 60.00), -- Orc Berserker -> Slayer's Greatsword
    (7, 13, 40.00), -- Orc Berserker -> Leather Greaves

    -- Stone Golem (ID 8) Drops
    (8, 6, 50.00), -- Stone Golem -> Tower Shield
    (8, 9, 45.00), -- Stone Golem -> Knight's Helm
    (8, 14, 25.00), -- Stone Golem -> Steelplated Legguards

    -- Dark Sorcerer (ID 9) Drops
    (9, 4, 50.00), -- Dark Sorcerer -> Cursed Bloodpike
    (9, 12, 40.00), -- Dark Sorcerer -> Shadow Rogue Leather
    (9, 16, 30.00), -- Dark Sorcerer -> Swift-Step Boots

    -- Malakor the Desolate Dragon [Boss] (ID 10) Drops
    (10, 2, 50.00), -- Malakor the Desolate Dragon -> Slayer's Greatsword
    (10, 11, 40.00), -- Malakor the Desolate Dragon -> Steel Breastplate
    (10, 14, 40.00), -- Malakor the Desolate Dragon -> Steelplated Legguards
    (10, 18, 30.00); -- Malakor the Desolate Dragon -> Vampire's Amulet


INSERT INTO item_templates (
name, description, item_type, 
base_hp, base_atk, base_def, base_spd, 
base_crit_rate, base_crit_dmg, base_eva, base_lifesteal, 
sell_amount
) VALUES 
('Rusty Sword', 'A battered iron sword. It barely cuts, but it gets the job done.', 'Weapon', 0, 10, 0, 0, 0.05, 1.50, 0.00, 0.00, 15),

('Slayer''s Greatsword', 'A massive, heavy blade that favors raw damage over speed.', 'Weapon', 0, 35, 0, -2, 0.10, 1.60, 0.00, 0.00, 120),

('Assassin''s Dagger', 'Lightweight and exceptionally sharp. Perfect for exploiting vital spots.', 'Weapon', 0, 12, 0, 4, 0.25, 2.00, 0.02, 0.00, 95),

('Cursed Bloodpike', 'A spear that thirsts for vital fluid. It heals the wielder on impact.', 'Weapon', 0, 22, 0, 1, 0.08, 1.50, 0.00, 0.12, 210),

('Battered Wooden Shield', 'Splintering wood held together by rusted bands.', 'Shield', 20, 0, 5, -1, 0.00, 0.00, 0.01, 0.00, 10),

('Tower Shield', 'A massive wall of iron. Grants immense defense at the cost of attack tempo.', 'Shield', 80, 0, 25, -4, 0.00, 0.00, 0.00, 0.00, 140),

('Buckler', 'A small metal shield designed for parrying and quick redirection.', 'Shield', 15, 2, 8, 2, 0.02, 0.00, 0.05, 0.00, 75),

('Ragged Hood', 'Faded cloth that offers minor concealment.', 'Helmet', 10, 0, 2, 1, 0.00, 0.00, 0.02, 0.00, 8),

('Knight''s Helm', 'Sturdy steel headwear offering excellent standard protection.', 'Helmet', 30, 0, 12, -1, 0.00, 0.00, 0.00, 0.00, 85),

('Tattered Cloth Garb', 'Barely qualifies as clothing, let alone armor.', 'Chestplate', 15, 0, 3, 2, 0.00, 0.00, 0.01, 0.00, 12),

('Steel Breastplate', 'A beautifully forged piece of defensive plate armor.', 'Chestplate', 100, 0, 30, -3, 0.00, 0.00, 0.00, 0.00, 250),

('Shadow Rogue Leather', 'Darkened, reinforced leather that keeps your movements silent.', 'Chestplate', 45, 4, 14, 3, 0.05, 0.10, 0.06, 0.00, 190),

('Leather Greaves', 'Basic leg guards made from boiled leather.', 'Leggings', 25, 0, 6, 1, 0.00, 0.00, 0.02, 0.00, 45),

('Steelplated Legguards', 'Reinforced steel tassets that offer great protection at the cost of mobility.', 'Leggings', 65, 0, 22, -3, 0.00, 0.00, 0.00, 0.00, 150),

('Heavy Iron Sabatons', 'Thick, clunky iron boots that make running difficult but stomping easy.', 'Boots', 40, 0, 15, -2, 0.00, 0.00, 0.00, 0.00, 70),

('Swift-Step Boots', 'Lightweight footwear woven with enchanted fibers.', 'Boots', 15, 0, 4, 6, 0.00, 0.00, 0.08, 0.00, 110),

('Gold Ring of Greed', 'A shiny band that glimmers in the dark.', 'Accessory', 0, 2, 0, 1, 0.02, 0.05, 0.00, 0.00, 300),

('Vampire''s Amulet', 'A sinister pendant housing a droplet of eternal blood.', 'Accessory', -10, 5, 0, 0, 0.04, 0.00, 0.00, 0.06, 180);


INSERT INTO enemies 
    (name, type, level, base_hp, base_atk, base_def, base_spd, base_crit_rate, base_crit_dmg, base_eva, base_lifesteal, base_expdrop, base_golddrop)
VALUES
    ('Frail Skeleton', 'Normal', 1, 35, 6, 2, 85, 0.05, 1.50, 0.00, 0.00, 15, 8),
    ('Goblin Thief', 'Normal', 2, 50, 10, 3, 115, 0.15, 1.60, 0.10, 0.00, 25, 20),
    ('Vampiric Bat', 'Normal', 2, 40, 9, 1, 125, 0.10, 1.50, 0.15, 0.20, 22, 12),
    ('Slime Blob', 'Normal', 1, 25, 4, 1, 70, 0.00, 1.50, 0.05, 0.00, 10, 5),
    ('Dungeon Rat', 'Normal', 1, 20, 5, 0, 110, 0.08, 1.50, 0.12, 0.00, 8, 4),
    ('Zombie Wanderer', 'Normal', 2, 65, 8, 4, 65, 0.02, 1.50, 0.00, 0.05, 28, 10),
    ('Orc Berserker', 'Normal', 4, 110, 22, 6, 90, 0.20, 1.75, 0.00, 0.05, 55, 35),
    ('Stone Golem', 'Normal', 5, 180, 15, 20, 60, 0.00, 1.50, 0.00, 0.00, 70, 40),
    ('Dark Sorcerer', 'Normal', 5, 85, 26, 4, 100, 0.08, 1.50, 0.05, 0.00, 75, 50),
    ('Malakor the Desolate Dragon', 'Boss', 5, 750, 55, 30, 105, 0.12, 1.80, 0.02, 0.00, 500, 350);