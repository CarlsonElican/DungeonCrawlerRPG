INSERT INTO event_results (result_type, gold_change, hp_change, exp_change, notes)
VALUES
    ('Victory', 12, -8, 15, 'Defeated the enemy and gained rewards.'),
    ('Treasure Found', 100, 0, 5, 'Opened a chest and found gold.'),
    ('Healed', 0, 20, 0, 'Recovered health from a fountain.'),
    ('Cursed Reward', 40, -15, 20, 'Accepted a dangerous shrine reward.'),
    ('Failed Trap', -5, -10, 0, 'Triggered a trap and lost some gold.'),
    ('Looted Corpse', 50, 0, 0, 'Searched a fallen adventurer and recovered their spare gold.'),
    ('Hidden Treasure Room', 200, 0, 0, 'Discovered a hidden treasure room packed with gold.');
