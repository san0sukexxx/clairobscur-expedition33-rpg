CREATE TABLE IF NOT EXISTS damage_modifier (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_character_id INTEGER NOT NULL,
    modifier_type TEXT NOT NULL,
    multiplier REAL NOT NULL,
    flat_bonus INTEGER NOT NULL DEFAULT 0,
    condition_type TEXT,
    is_active BOOLEAN NOT NULL DEFAULT 1,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character(id) ON DELETE CASCADE
);

CREATE INDEX idx_damage_modifier_battle_character ON damage_modifier(battle_character_id);
CREATE INDEX idx_damage_modifier_active ON damage_modifier(is_active);
