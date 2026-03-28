CREATE TABLE IF NOT EXISTS player_setup_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    section TEXT NOT NULL,
    done BOOLEAN DEFAULT 0,
    UNIQUE(player_id, section)
);
