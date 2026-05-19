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
    (3, 1, 1, 1, 'Starter weapon', TRUE, 0, 0, 1, 0, 0),
    (3, 2, 1, 1, 'Starter armor', TRUE, 0, 2, 0, 1, 0),
    (3, 5, 1, 1, 'Restores 25 HP', FALSE, 0, 0, 0, 0, 0),
    (4, 3, 2, 1, 'Increases speed', TRUE, 0, 0, 0, 0, 2),
    (4, 4, 3, 2, 'Adds lifesteal', TRUE, 1, 0, 2, 0, 0);