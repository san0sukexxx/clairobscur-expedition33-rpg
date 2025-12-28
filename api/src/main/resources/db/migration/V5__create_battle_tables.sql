CREATE TABLE
    IF NOT EXISTS battle (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        battle_status TEXT NOT NULL,
        team_a_gradient_points INTEGER NOT NULL DEFAULT 0,
        team_b_gradient_points INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (campaign_id) REFERENCES campaign (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS battle_character (
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
        charge_points INTEGER,
        max_charge_points INTEGER,
        sun_charges INTEGER,
        moon_charges INTEGER,
        stance TEXT,
        stain_slot_1 TEXT,
        stain_slot_2 TEXT,
        stain_slot_3 TEXT,
        stain_slot_4 TEXT,
        perfection_rank TEXT,
        rank_progress INTEGER,
        bestial_wheel_position INTEGER,
        can_roll_initiative BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (battle_id) REFERENCES battle (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS battle_initiative (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battle_id INTEGER NOT NULL,
        battle_character_id INTEGER NOT NULL,
        initiative_value INTEGER NOT NULL,
        hability INTEGER NOT NULL,
        play_first BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (battle_id) REFERENCES battle (id) ON DELETE CASCADE,
        FOREIGN KEY (battle_character_id) REFERENCES battle_character (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS battle_status_effect (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battle_character_id INTEGER NOT NULL,
        effect_type TEXT NOT NULL,
        ammount INTEGER NOT NULL,
        remaining_turns INTEGER,
        is_resolved BOOLEAN DEFAULT 0,
        skip_next_decrement BOOLEAN NOT NULL DEFAULT 0,
        FOREIGN KEY (battle_character_id) REFERENCES battle_character (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS battle_turn (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battle_id INTEGER NOT NULL,
        battle_character_id INTEGER NOT NULL,
        play_order INTEGER NOT NULL,
        FOREIGN KEY (battle_id) REFERENCES battle (id) ON DELETE CASCADE,
        FOREIGN KEY (battle_character_id) REFERENCES battle_character (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS battle_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battle_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        event_json TEXT,
        FOREIGN KEY (battle_id) REFERENCES battle (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS attack (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        battle_id INTEGER NOT NULL,
        total_power INTEGER NOT NULL,
        target_battle_id INTEGER NOT NULL,
        source_battle_id INTEGER NOT NULL,
        total_defended INTEGER,
        is_resolved BOOLEAN DEFAULT 0,
        allow_counter BOOLEAN DEFAULT 0,
        is_counter_resolved BOOLEAN DEFAULT 0,
        defense_type TEXT,
        FOREIGN KEY (battle_id) REFERENCES battle (id) ON DELETE CASCADE,
        FOREIGN KEY (target_battle_id) REFERENCES battle_character (id) ON DELETE CASCADE,
        FOREIGN KEY (source_battle_id) REFERENCES battle_character (id) ON DELETE CASCADE
    );

CREATE TABLE
    IF NOT EXISTS attack_status_effect (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        attack_id INTEGER NOT NULL,
        effect_type TEXT NOT NULL,
        ammount INTEGER NOT NULL,
        remaining_turns INTEGER,
        FOREIGN KEY (attack_id) REFERENCES attack (id) ON DELETE CASCADE
    );