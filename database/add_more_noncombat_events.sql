-- Adds the expanded non-combat event set without reseeding the whole database.
-- Safe to run more than once.

UPDATE event_templates
SET
    name = 'Loot Corpse',
    event_type = 'Treasure',
    description = 'A fallen adventurer lies nearby with a coin pouch still intact.'
WHERE name = 'Merchant Camp';

INSERT INTO event_templates (name, event_type, description)
SELECT 'Loot Corpse', 'Treasure', 'A fallen adventurer lies nearby with a coin pouch still intact.'
WHERE NOT EXISTS (
    SELECT 1 FROM event_templates WHERE name = 'Loot Corpse'
);

INSERT INTO event_templates (name, event_type, description)
SELECT 'Hidden Treasure Room', 'Treasure', 'A loose stone reveals a hidden chamber glittering with forgotten riches.'
WHERE NOT EXISTS (
    SELECT 1 FROM event_templates WHERE name = 'Hidden Treasure Room'
);

INSERT INTO event_templates (name, event_type, description)
SELECT 'Robbed While Sleeping', 'Risk', 'You wake from a brief rest to find your coin pouch cut open.'
WHERE NOT EXISTS (
    SELECT 1 FROM event_templates WHERE name = 'Robbed While Sleeping'
);

INSERT INTO event_results (result_type, gold_change, hp_change, exp_change, notes)
SELECT 'Looted Corpse', 50, 0, 0, 'Searched a fallen adventurer and recovered their spare gold.'
WHERE NOT EXISTS (
    SELECT 1 FROM event_results WHERE result_type = 'Looted Corpse'
);

INSERT INTO event_results (result_type, gold_change, hp_change, exp_change, notes)
SELECT 'Hidden Treasure Room', 200, 0, 0, 'Discovered a hidden treasure room packed with gold.'
WHERE NOT EXISTS (
    SELECT 1 FROM event_results WHERE result_type = 'Hidden Treasure Room'
);

INSERT INTO event_results (result_type, gold_change, hp_change, exp_change, notes)
SELECT 'Robbed While Sleeping', -100, 0, 0, 'Lost gold after being robbed during a short rest.'
WHERE NOT EXISTS (
    SELECT 1 FROM event_results WHERE result_type = 'Robbed While Sleeping'
);

DELETE FROM event_template_results
WHERE event_template_id IN (
    SELECT event_template_id
    FROM event_templates
    WHERE name IN ('Loot Corpse', 'Hidden Treasure Room', 'Robbed While Sleeping')
);

INSERT INTO event_template_results (event_template_id, event_result_id, weight, min_floor, max_floor)
SELECT et.event_template_id, er.event_result_id, 1.00, 1, NULL
FROM event_templates et
JOIN event_results er ON er.result_type = 'Looted Corpse'
WHERE et.name = 'Loot Corpse';

INSERT INTO event_template_results (event_template_id, event_result_id, weight, min_floor, max_floor)
SELECT et.event_template_id, er.event_result_id, 1.00, 2, NULL
FROM event_templates et
JOIN event_results er ON er.result_type = 'Hidden Treasure Room'
WHERE et.name = 'Hidden Treasure Room';

INSERT INTO event_template_results (event_template_id, event_result_id, weight, min_floor, max_floor)
SELECT et.event_template_id, er.event_result_id, 1.00, 1, NULL
FROM event_templates et
JOIN event_results er ON er.result_type = 'Robbed While Sleeping'
WHERE et.name = 'Robbed While Sleeping';
