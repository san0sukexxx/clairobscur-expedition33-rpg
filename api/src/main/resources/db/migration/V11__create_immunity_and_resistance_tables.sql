-- Create status_immunity table
CREATE TABLE IF NOT EXISTS status_immunity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_character_id INTEGER NOT NULL,
    status_type TEXT NOT NULL,
    immunity_type TEXT NOT NULL,
    resist_chance INTEGER,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character(id) ON DELETE CASCADE
);

-- Create element_resistance table
CREATE TABLE IF NOT EXISTS element_resistance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_character_id INTEGER NOT NULL,
    element TEXT NOT NULL,
    resistance_type TEXT NOT NULL,
    damage_multiplier REAL NOT NULL,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_status_immunity_battle_character ON status_immunity(battle_character_id);
CREATE INDEX idx_status_immunity_status_type ON status_immunity(battle_character_id, status_type);
CREATE INDEX idx_element_resistance_battle_character ON element_resistance(battle_character_id);
CREATE INDEX idx_element_resistance_element ON element_resistance(battle_character_id, element);
