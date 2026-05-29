INSERT INTO item_templates (
    name, description, item_type, 
    base_hp, base_atk, base_def, base_spd, 
    base_crit_rate, base_crit_dmg, base_eva, base_lifesteal, 
    sell_amount
) VALUES 
('Rusty Sword', 'A battered iron sword. It barely cuts, but it gets the job done.', 'Weapon', 0, 8, 0, 0, 0.02, 0.00, 0.00, 0.00, 15),

('Slayer''s Greatsword', 'A massive, heavy blade that favors raw damage over speed.', 'Weapon', 0, 28, 0, -4, 0.06, 0.15, 0.00, 0.00, 120),

('Assassin''s Dagger', 'Lightweight and exceptionally sharp. Perfect for exploiting vital spots.', 'Weapon', 0, 12, 0, 6, 0.12, 0.25, 0.03, 0.00, 95),

('Cursed Bloodpike', 'A spear that thirsts for vital fluid. It heals the wielder on impact.', 'Weapon', -5, 20, 0, 1, 0.05, 0.10, 0.00, 0.05, 185),

('Battered Wooden Shield', 'Splintering wood held together by rusted bands.', 'Shield', 20, 0, 5, -1, 0.00, 0.00, 0.01, 0.00, 20),

('Tower Shield', 'A massive wall of iron. Grants immense defense at the cost of attack tempo.', 'Shield', 70, 0, 18, -4, 0.00, 0.00, 0.00, 0.00, 140),

('Buckler', 'A small metal shield designed for parrying and quick redirection.', 'Shield', 15, 2, 7, 2, 0.02, 0.00, 0.03, 0.00, 75),

('Ragged Hood', 'Faded cloth that offers minor concealment.', 'Helmet', 10, 0, 2, 1, 0.00, 0.00, 0.02, 0.00, 18),

('Knight''s Helm', 'Sturdy steel headwear offering excellent standard protection.', 'Helmet', 30, 0, 10, -1, 0.00, 0.00, 0.00, 0.00, 85),

('Tattered Cloth Garb', 'Barely qualifies as clothing, let alone armor.', 'Chestplate', 15, 0, 3, 2, 0.00, 0.00, 0.01, 0.00, 22),

('Steel Breastplate', 'A beautifully forged piece of defensive plate armor.', 'Chestplate', 80, 0, 22, -3, 0.00, 0.00, 0.00, 0.00, 210),

('Shadow Rogue Leather', 'Darkened, reinforced leather that keeps your movements silent.', 'Chestplate', 45, 4, 12, 3, 0.04, 0.10, 0.04, 0.00, 190),

('Leather Greaves', 'Basic leg guards made from boiled leather.', 'Leggings', 25, 0, 6, 1, 0.00, 0.00, 0.02, 0.00, 45),

('Steelplated Legguards', 'Reinforced steel tassets that offer great protection at the cost of mobility.', 'Leggings', 55, 0, 16, -3, 0.00, 0.00, 0.00, 0.00, 150),

('Heavy Iron Sabatons', 'Thick, clunky iron boots that make running difficult but stomping easy.', 'Boots', 35, 0, 10, -2, 0.00, 0.00, 0.00, 0.00, 70),

('Swift-Step Boots', 'Lightweight footwear woven with enchanted fibers.', 'Boots', 15, 0, 4, 6, 0.00, 0.00, 0.08, 0.00, 110),

('Gold Ring of Greed', 'A shiny band that glimmers in the dark.', 'Accessory', 0, 2, 0, 1, 0.02, 0.05, 0.00, 0.00, 130),

('Vampire''s Amulet', 'A sinister pendant housing a droplet of eternal blood.', 'Accessory', -5, 4, 0, 0, 0.03, 0.00, 0.00, 0.04, 180),

('Iron Longsword', 'A reliable blade balanced for steady dungeon work.', 'Weapon', 0, 16, 0, 0, 0.04, 0.05, 0.00, 0.00, 70),

('Stormglass Rapier', 'A thin enchanted blade that rewards quick precise strikes.', 'Weapon', 0, 22, 0, 5, 0.10, 0.22, 0.04, 0.00, 180),

('Aegis Kite Shield', 'A disciplined shield with a reinforced center boss.', 'Shield', 45, 0, 14, -1, 0.00, 0.00, 0.01, 0.00, 90),

('Runed Ward Shield', 'Etched runes help redirect lethal blows.', 'Shield', 55, 0, 16, 0, 0.00, 0.00, 0.02, 0.00, 160),

('Scout Mask', 'A light mask favored by dungeon scouts.', 'Helmet', 18, 2, 5, 3, 0.03, 0.00, 0.03, 0.00, 65),

('Warlord Horned Helm', 'Heavy horned steel that makes retreat feel unlikely.', 'Helmet', 45, 3, 14, -2, 0.02, 0.08, 0.00, 0.00, 155),

('Chainmail Hauberk', 'Linked iron rings that offer dependable protection.', 'Chestplate', 60, 0, 16, -1, 0.00, 0.00, 0.00, 0.00, 120),

('Emberforged Plate', 'A dense plate suit still warm from its forge magic.', 'Chestplate', 105, 2, 26, -4, 0.00, 0.00, 0.00, 0.02, 260),

('Ranger Trousers', 'Flexible legwear for quick footwork.', 'Leggings', 35, 1, 8, 4, 0.02, 0.00, 0.04, 0.00, 85),

('Dragonscale Cuisses', 'Scaled leg armor with excellent protection.', 'Leggings', 70, 2, 20, -2, 0.00, 0.08, 0.01, 0.00, 220),

('Pathfinder Boots', 'Soft boots built for long dungeon marches.', 'Boots', 25, 0, 6, 5, 0.00, 0.00, 0.05, 0.00, 95),

('Thunderstep Sabatons', 'Heavy boots that crackle with stored momentum.', 'Boots', 40, 3, 10, 3, 0.03, 0.08, 0.02, 0.00, 190),

('Charm of Second Wind', 'A small charm that steadies the wearer after hard hits.', 'Accessory', 30, 0, 4, 0, 0.00, 0.00, 0.02, 0.02, 140),

('Eye of the Deep', 'A cold gem that sharpens the senses in total darkness.', 'Accessory', 0, 5, 0, 2, 0.06, 0.18, 0.03, 0.00, 210);
