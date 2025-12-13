CREATE TABLE player_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    item_id TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    max_quantity INTEGER NOT NULL DEFAULT 99,
    FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE,
    UNIQUE (player_id, item_id)
);
