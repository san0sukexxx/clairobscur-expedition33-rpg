CREATE TABLE
    IF NOT EXISTS campaign (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        battle_id INTEGER
    );

CREATE TABLE
    IF NOT EXISTS campaign_character (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        character TEXT NOT NULL,
        FOREIGN KEY (campaign_id) REFERENCES campaign (id) ON DELETE CASCADE ON UPDATE CASCADE
    );