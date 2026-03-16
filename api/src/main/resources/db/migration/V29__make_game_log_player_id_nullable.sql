-- SQLite does not support ALTER COLUMN, so we recreate the table
CREATE TABLE game_log_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    player_id INTEGER,
    roll_type TEXT NOT NULL,
    ability_key TEXT,
    skill_id TEXT,
    sense_key TEXT,
    dice_rolled INTEGER NOT NULL,
    modifier INTEGER NOT NULL,
    total INTEGER NOT NULL,
    dice_command TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO game_log_new SELECT * FROM game_log;
DROP TABLE game_log;
ALTER TABLE game_log_new RENAME TO game_log;
