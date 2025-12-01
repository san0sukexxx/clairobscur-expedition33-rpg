CREATE TABLE
    player_pictos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        picto_id TEXT NOT NULL,
        level INTEGER NOT NULL DEFAULT 1,
        slot INTEGER NOT NULL DEFAULT 0,
        battle_count INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
        UNIQUE (player_id, picto_id)
    );

CREATE TABLE
    player_luminas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_id INTEGER NOT NULL,
        picto_id TEXT NOT NULL,
        FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
        UNIQUE (player_id, picto_id)
    );