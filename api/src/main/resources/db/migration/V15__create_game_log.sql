CREATE TABLE IF NOT EXISTS game_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
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
