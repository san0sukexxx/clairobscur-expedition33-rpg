CREATE TABLE
    battle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        battle_status TEXT NOT NULL
    );

CREATE TABLE
    battle_character (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battle_id INTEGER NOT NULL,
        external_id TEXT NOT NULL,
        character_name TEXT NOT NULL,
        character_type TEXT NOT NULL,
        is_enemy BOOLEAN NOT NULL DEFAULT 0,
        health_points INTEGER NOT NULL,
        max_health_points INTEGER NOT NULL,
        magic_points INTEGER,
        max_magic_points INTEGER,
        can_roll_initiative BOOLEAN NOT NULL DEFAULT 0
    );

CREATE TABLE
    battle_initiative (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battle_character_id INTEGER NOT NULL,
        initiative_value INTEGER NOT NULL,
        hability INTEGER NOT NULL,
        play_first BOOLEAN NOT NULL DEFAULT 0
    );

CREATE TABLE
    battle_status_effect (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battle_character_id INTEGER NOT NULL,
        effect_type TEXT NOT NULL,
        ammount INTEGER NOT NULL
    );