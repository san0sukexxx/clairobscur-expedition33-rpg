CREATE TABLE
    IF NOT EXISTS player (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        character_id TEXT,
        total_points INTEGER DEFAULT 0,
        xp INTEGER DEFAULT 0,
        power INTEGER DEFAULT 0,
        hability INTEGER DEFAULT 0,
        resistance INTEGER DEFAULT 0,
        ap_current INTEGER DEFAULT 0,
        mp_current INTEGER DEFAULT 0,
        hp_current INTEGER DEFAULT 0,
        notes TEXT,
        weapon_id TEXT
    );