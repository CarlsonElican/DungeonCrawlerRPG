INSERT INTO loot_table (enemy_id, item_template_id, weight)
VALUES
    -- ==========================================
    -- EARLY GAME MONSTERS
    -- ==========================================
    -- Frail Skeleton
    ((SELECT enemy_id FROM enemies WHERE name = 'Frail Skeleton'), (SELECT item_template_id FROM item_templates WHERE name = 'Rusty Sword'), 70.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Frail Skeleton'), (SELECT item_template_id FROM item_templates WHERE name = 'Battered Wooden Shield'), 40.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Frail Skeleton'), (SELECT item_template_id FROM item_templates WHERE name = 'Ragged Hood'), 30.00),

    -- Goblin Thief
    ((SELECT enemy_id FROM enemies WHERE name = 'Goblin Thief'), (SELECT item_template_id FROM item_templates WHERE name = 'Assassin''s Dagger'), 50.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Goblin Thief'), (SELECT item_template_id FROM item_templates WHERE name = 'Buckler'), 40.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Goblin Thief'), (SELECT item_template_id FROM item_templates WHERE name = 'Tattered Cloth Garb'), 50.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Goblin Thief'), (SELECT item_template_id FROM item_templates WHERE name = 'Gold Ring of Greed'), 10.00),

    -- Vampiric Bat
    ((SELECT enemy_id FROM enemies WHERE name = 'Vampiric Bat'), (SELECT item_template_id FROM item_templates WHERE name = 'Ragged Hood'), 60.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Vampiric Bat'), (SELECT item_template_id FROM item_templates WHERE name = 'Vampire''s Amulet'), 15.00),

    -- Slime Blob
    ((SELECT enemy_id FROM enemies WHERE name = 'Slime Blob'), (SELECT item_template_id FROM item_templates WHERE name = 'Rusty Sword'), 60.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Slime Blob'), (SELECT item_template_id FROM item_templates WHERE name = 'Battered Wooden Shield'), 50.00),

    -- Dungeon Rat
    ((SELECT enemy_id FROM enemies WHERE name = 'Dungeon Rat'), (SELECT item_template_id FROM item_templates WHERE name = 'Ragged Hood'), 50.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Dungeon Rat'), (SELECT item_template_id FROM item_templates WHERE name = 'Tattered Cloth Garb'), 50.00),

    -- Zombie Wanderer
    ((SELECT enemy_id FROM enemies WHERE name = 'Zombie Wanderer'), (SELECT item_template_id FROM item_templates WHERE name = 'Rusty Sword'), 40.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Zombie Wanderer'), (SELECT item_template_id FROM item_templates WHERE name = 'Leather Greaves'), 40.00),

    -- Boneguard Skeleton
    ((SELECT enemy_id FROM enemies WHERE name = 'Boneguard Skeleton'), (SELECT item_template_id FROM item_templates WHERE name = 'Iron Longsword'), 55.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Boneguard Skeleton'), (SELECT item_template_id FROM item_templates WHERE name = 'Aegis Kite Shield'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Boneguard Skeleton'), (SELECT item_template_id FROM item_templates WHERE name = 'Scout Mask'), 35.00),

    -- Acid Slime
    ((SELECT enemy_id FROM enemies WHERE name = 'Acid Slime'), (SELECT item_template_id FROM item_templates WHERE name = 'Aegis Kite Shield'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Acid Slime'), (SELECT item_template_id FROM item_templates WHERE name = 'Chainmail Hauberk'), 45.00),

    -- Grimjaw Skeleton Captain [Boss]
    ((SELECT enemy_id FROM enemies WHERE name = 'Grimjaw Skeleton Captain'), (SELECT item_template_id FROM item_templates WHERE name = 'Iron Longsword'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Grimjaw Skeleton Captain'), (SELECT item_template_id FROM item_templates WHERE name = 'Aegis Kite Shield'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Grimjaw Skeleton Captain'), (SELECT item_template_id FROM item_templates WHERE name = 'Warlord Horned Helm'), 25.00),

    -- ==========================================
    -- MID GAME MONSTERS
    -- ==========================================
    -- Goblin Cutthroat
    ((SELECT enemy_id FROM enemies WHERE name = 'Goblin Cutthroat'), (SELECT item_template_id FROM item_templates WHERE name = 'Stormglass Rapier'), 55.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Goblin Cutthroat'), (SELECT item_template_id FROM item_templates WHERE name = 'Swift-Step Boots'), 30.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Goblin Cutthroat'), (SELECT item_template_id FROM item_templates WHERE name = 'Scout Mask'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Goblin Cutthroat'), (SELECT item_template_id FROM item_templates WHERE name = 'Ranger Trousers'), 40.00),

    -- Plague Zombie
    ((SELECT enemy_id FROM enemies WHERE name = 'Plague Zombie'), (SELECT item_template_id FROM item_templates WHERE name = 'Chainmail Hauberk'), 60.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Plague Zombie'), (SELECT item_template_id FROM item_templates WHERE name = 'Charm of Second Wind'), 25.00),

    -- Cave Bat Matriarch
    ((SELECT enemy_id FROM enemies WHERE name = 'Cave Bat Matriarch'), (SELECT item_template_id FROM item_templates WHERE name = 'Stormglass Rapier'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Cave Bat Matriarch'), (SELECT item_template_id FROM item_templates WHERE name = 'Pathfinder Boots'), 50.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Cave Bat Matriarch'), (SELECT item_template_id FROM item_templates WHERE name = 'Eye of the Deep'), 20.00),

    -- Orc Berserker
    ((SELECT enemy_id FROM enemies WHERE name = 'Orc Berserker'), (SELECT item_template_id FROM item_templates WHERE name = 'Slayer''s Greatsword'), 60.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Orc Berserker'), (SELECT item_template_id FROM item_templates WHERE name = 'Leather Greaves'), 40.00),

    -- Stone Golem
    ((SELECT enemy_id FROM enemies WHERE name = 'Stone Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Tower Shield'), 50.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Stone Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Knight''s Helm'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Stone Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Steelplated Legguards'), 25.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Stone Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Heavy Iron Sabatons'), 35.00),

    -- Dark Sorcerer
    ((SELECT enemy_id FROM enemies WHERE name = 'Dark Sorcerer'), (SELECT item_template_id FROM item_templates WHERE name = 'Cursed Bloodpike'), 50.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Dark Sorcerer'), (SELECT item_template_id FROM item_templates WHERE name = 'Shadow Rogue Leather'), 40.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Dark Sorcerer'), (SELECT item_template_id FROM item_templates WHERE name = 'Swift-Step Boots'), 30.00),

    -- Grumthar the Orc Warden [Boss]
    ((SELECT enemy_id FROM enemies WHERE name = 'Grumthar the Orc Warden'), (SELECT item_template_id FROM item_templates WHERE name = 'Warlord Horned Helm'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Grumthar the Orc Warden'), (SELECT item_template_id FROM item_templates WHERE name = 'Emberforged Plate'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Grumthar the Orc Warden'), (SELECT item_template_id FROM item_templates WHERE name = 'Thunderstep Sabatons'), 30.00),

    -- ==========================================
    -- LATE GAME MONSTERS
    -- ==========================================
    -- Orc Shieldbreaker
    ((SELECT enemy_id FROM enemies WHERE name = 'Orc Shieldbreaker'), (SELECT item_template_id FROM item_templates WHERE name = 'Warlord Horned Helm'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Orc Shieldbreaker'), (SELECT item_template_id FROM item_templates WHERE name = 'Emberforged Plate'), 35.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Orc Shieldbreaker'), (SELECT item_template_id FROM item_templates WHERE name = 'Thunderstep Sabatons'), 35.00),

    -- Crystal Golem
    ((SELECT enemy_id FROM enemies WHERE name = 'Crystal Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Runed Ward Shield'), 40.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Crystal Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Dragonscale Cuisses'), 40.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Crystal Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Eye of the Deep'), 30.00),

    -- Void Sorcerer
    ((SELECT enemy_id FROM enemies WHERE name = 'Void Sorcerer'), (SELECT item_template_id FROM item_templates WHERE name = 'Stormglass Rapier'), 35.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Void Sorcerer'), (SELECT item_template_id FROM item_templates WHERE name = 'Charm of Second Wind'), 35.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Void Sorcerer'), (SELECT item_template_id FROM item_templates WHERE name = 'Eye of the Deep'), 45.00),

    -- Asterion the Crystal Golem [Boss]
    ((SELECT enemy_id FROM enemies WHERE name = 'Asterion the Crystal Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Runed Ward Shield'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Asterion the Crystal Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Dragonscale Cuisses'), 45.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Asterion the Crystal Golem'), (SELECT item_template_id FROM item_templates WHERE name = 'Eye of the Deep'), 35.00),

    -- Malakor the Desolate Dragon [Mega Boss]
    ((SELECT enemy_id FROM enemies WHERE name = 'Malakor the Desolate Dragon'), (SELECT item_template_id FROM item_templates WHERE name = 'Slayer''s Greatsword'), 50.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Malakor the Desolate Dragon'), (SELECT item_template_id FROM item_templates WHERE name = 'Steel Breastplate'), 40.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Malakor the Desolate Dragon'), (SELECT item_template_id FROM item_templates WHERE name = 'Steelplated Legguards'), 40.00),
    ((SELECT enemy_id FROM enemies WHERE name = 'Malakor the Desolate Dragon'), (SELECT item_template_id FROM item_templates WHERE name = 'Vampire''s Amulet'), 30.00);