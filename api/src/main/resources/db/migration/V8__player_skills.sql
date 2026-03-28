CREATE TABLE IF NOT EXISTS player_special_attacks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    special_attack_id TEXT NOT NULL,
    slot INTEGER,
    FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE
);
