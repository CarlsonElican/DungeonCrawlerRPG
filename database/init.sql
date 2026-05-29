CREATE DATABASE rpg_game;

DROP TABLE IF EXISTS run_events CASCADE;
DROP TABLE IF EXISTS event_results CASCADE;
DROP TABLE IF EXISTS event_templates CASCADE;
DROP TABLE IF EXISTS game_runs CASCADE;
DROP TABLE IF EXISTS shop_offer CASCADE;
DROP TABLE IF EXISTS loot_table CASCADE;
DROP TABLE IF EXISTS enemies CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS inventory_items CASCADE;
DROP TABLE IF EXISTS item_templates CASCADE;
DROP TABLE IF EXISTS rarity CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE characters (
    character_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    exp_cap INT DEFAULT 100,
    current_hp INT,
    current_gold INT DEFAULT 0,
    kills INT DEFAULT 0,
    deaths INT DEFAULT 0,
    base_hp INT NOT NULL,
    base_atk INT NOT NULL,
    base_def INT NOT NULL,
    base_spd INT NOT NULL,
    base_crit_rate NUMERIC(5,2) DEFAULT 0.00,
    base_crit_dmg NUMERIC(5,2) DEFAULT 1.50,
    base_eva NUMERIC(5,2) DEFAULT 0.00,
    base_lifesteal NUMERIC(5,2) DEFAULT 0.00,
    starter_skill VARCHAR(255),
    total_days_survived INT DEFAULT 0,
    highest_floor_reached INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rarity (
    rarity_id SERIAL PRIMARY KEY,
    rarity_name VARCHAR(50) NOT NULL,
    stat_multiplier NUMERIC(5,2) DEFAULT 1.0,
    sell_price_multiplier NUMERIC(5,2) DEFAULT 1.0,
    weight NUMERIC(5,2) DEFAULT 1.0,
    hex_color VARCHAR(7)
);

CREATE TABLE item_templates (
    item_template_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type VARCHAR(50),
    base_hp INT DEFAULT 0,
    base_atk INT DEFAULT 0,
    base_def INT DEFAULT 0,
    base_spd INT DEFAULT 0,
    base_crit_rate NUMERIC(5,2) DEFAULT 0,
    base_crit_dmg NUMERIC(5,2) DEFAULT 0,
    base_eva NUMERIC(5,2) DEFAULT 0,
    base_lifesteal NUMERIC(5,2) DEFAULT 0,
    sell_amount INT DEFAULT 0
);

CREATE TABLE inventory_items (
    inventory_item_id SERIAL PRIMARY KEY,
    character_id INT NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
    item_template_id INT NOT NULL REFERENCES item_templates(item_template_id),
    rarity_id INT NOT NULL REFERENCES rarity(rarity_id),
    item_level INT DEFAULT 1,
    item_effect TEXT,
    is_equipped BOOLEAN DEFAULT FALSE,
    upgraded_level INT DEFAULT 0,
    random_hp INT DEFAULT 0,
    random_atk INT DEFAULT 0,
    random_def INT DEFAULT 0,
    random_spd INT DEFAULT 0,
    random_crit_rate NUMERIC(5,2) DEFAULT 0,
    random_crit_dmg NUMERIC(5,2) DEFAULT 0,
    random_eva NUMERIC(5,2) DEFAULT 0,
    random_lifesteal NUMERIC(5,2) DEFAULT 0
);

CREATE TABLE equipment (
    equipment_id SERIAL PRIMARY KEY,
    character_id INT NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
    inventory_item_id INT NOT NULL REFERENCES inventory_items(inventory_item_id) ON DELETE CASCADE,
    slot VARCHAR(50) NOT NULL,
    UNIQUE (character_id, slot)
);

CREATE TABLE enemies (
    enemy_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    level INT DEFAULT 1,
    base_hp INT,
    base_atk INT,
    base_def INT,
    base_spd INT,
    base_crit_rate NUMERIC(5,2),
    base_crit_dmg NUMERIC(5,2),
    base_eva NUMERIC(5,2),
    base_lifesteal NUMERIC(5,2),
    base_expdrop INT,
    base_golddrop INT
);

CREATE TABLE loot_table (
    loot_table_id SERIAL PRIMARY KEY,
    enemy_id INT NOT NULL REFERENCES enemies(enemy_id) ON DELETE CASCADE,
    item_template_id INT NOT NULL REFERENCES item_templates(item_template_id),
    weight NUMERIC(5,2) NOT NULL
);

CREATE TABLE shop_offer (
    shop_id SERIAL PRIMARY KEY,
    item_template_id INT NOT NULL REFERENCES item_templates(item_template_id),
    rarity_id INT NOT NULL REFERENCES rarity(rarity_id),
    day_number INT,
    price INT NOT NULL
);

CREATE TABLE game_runs (
    run_id SERIAL PRIMARY KEY,
    character_id INT NOT NULL REFERENCES characters(character_id) ON DELETE CASCADE,
    current_day INT DEFAULT 1,
    current_floor INT DEFAULT 1,
    current_room INT DEFAULT 1,
    events_completed INT DEFAULT 0,
    events_required INT DEFAULT 10,
    boss_unlocked BOOLEAN DEFAULT FALSE,
    max_gold_earned INT DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE TABLE event_templates (
    event_template_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE event_results (
    event_result_id SERIAL PRIMARY KEY,
    result_type VARCHAR(50) NOT NULL,
    gold_change INT DEFAULT 0,
    hp_change INT DEFAULT 0,
    exp_change INT DEFAULT 0,
    notes TEXT
);

CREATE TABLE run_events (
    run_event_id SERIAL PRIMARY KEY,
    run_id INT NOT NULL REFERENCES game_runs(run_id) ON DELETE CASCADE,
    event_template_id INT NOT NULL REFERENCES event_templates(event_template_id),
    event_result_id INT NOT NULL REFERENCES event_results(event_result_id),
    floor_number INT,
    room_number INT,
    sequence_number INT,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);