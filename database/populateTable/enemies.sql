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