INSERT INTO users (username, email, password_hash, last_login_at)
VALUES
    ('test_player', 'test_player@example.com', 'hashed_password_1', CURRENT_TIMESTAMP),
    ('demo_mage', 'demo_mage@example.com', 'hashed_password_2', CURRENT_TIMESTAMP);