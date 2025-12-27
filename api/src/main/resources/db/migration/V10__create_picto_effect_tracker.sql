CREATE TABLE IF NOT EXISTS picto_effect_tracker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_id INTEGER NOT NULL,
    battle_character_id INTEGER NOT NULL,
    picto_name TEXT NOT NULL,
    effect_type TEXT NOT NULL,
    times_triggered INTEGER NOT NULL DEFAULT 0,
    last_turn_triggered INTEGER,
    reset_on_turn_end BOOLEAN NOT NULL DEFAULT 0,
    FOREIGN KEY (battle_id) REFERENCES battle (id) ON DELETE CASCADE,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character (id) ON DELETE CASCADE
);
