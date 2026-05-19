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