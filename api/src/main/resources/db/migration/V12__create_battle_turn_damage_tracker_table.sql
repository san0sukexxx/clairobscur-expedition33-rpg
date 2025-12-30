-- Create battle_turn_damage_tracker table
-- Tracks damage taken per character per turn for picto effects

CREATE TABLE IF NOT EXISTS battle_turn_damage_tracker (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    battle_id INTEGER NOT NULL,
    battle_character_id INTEGER NOT NULL,
    turn_number INTEGER NOT NULL,
    damage_taken INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (battle_id) REFERENCES battle(id) ON DELETE CASCADE,
    FOREIGN KEY (battle_character_id) REFERENCES battle_character(id) ON DELETE CASCADE
);

-- Index for efficient lookups
CREATE INDEX idx_battle_turn_damage_tracker_lookup
ON battle_turn_damage_tracker(battle_id, battle_character_id, turn_number);
