CREATE TABLE player_asi_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    level INTEGER NOT NULL,
    attribute1 TEXT NOT NULL,
    amount1 INTEGER NOT NULL,
    attribute2 TEXT,
    amount2 INTEGER
);
