INSERT INTO event_template_results (
    event_template_id,
    event_result_id,
    weight,
    min_floor,
    max_floor
) VALUES
    -- Combat events resolve through the combat endpoint, but Victory is the
    -- canonical successful combat result recorded in run history.
    (1, 1, 1.00, 1, NULL),
    (6, 1, 1.00, 1, NULL),
    (7, 1, 1.00, 1, NULL),
    (8, 1, 1.00, 1, NULL),
    (9, 1, 1.00, 1, NULL),
    (10, 1, 1.00, 1, NULL),
    (11, 1, 1.00, 2, NULL),
    (12, 1, 1.00, 3, NULL),
    (13, 1, 1.00, 3, NULL),
    (14, 1, 1.00, 5, NULL),

    -- Abandoned Chest can reward treasure or spring a trap.
    (2, 2, 0.75, 1, NULL),
    (2, 5, 0.25, 1, NULL),

    -- Healing Fountain should only heal.
    (3, 3, 1.00, 1, NULL),

    -- Dark Shrine should trade health for reward.
    (4, 4, 1.00, 1, NULL),

    -- Loot Corpse gives a larger gold reward than a normal chest.
    (5, 6, 1.00, 1, NULL),
    (15, 1, 1.00, 1, NULL),
    (16, 1, 1.00, 1, NULL),
    (17, 1, 1.00, 2, NULL),
    (18, 1, 1.00, 2, NULL),
    (19, 1, 1.00, 3, NULL),
    (20, 1, 1.00, 4, NULL),
    (21, 1, 1.00, 5, NULL),
    (22, 1, 1.00, 6, NULL),
    (23, 1, 1.00, 1, 1),
    (24, 1, 1.00, 2, 3),
    (25, 1, 1.00, 4, 4),

    -- Additional non-combat dungeon events.
    (26, 7, 1.00, 2, NULL),
    (27, 8, 1.00, 1, NULL);
