CREATE TABLE
    IF NOT EXISTS campaign_player (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        player_id INTEGER NOT NULL,
        FOREIGN KEY (campaign_id) REFERENCES campaign (id) ON DELETE CASCADE ON UPDATE CASCADE,
        FOREIGN KEY (player_id) REFERENCES player (id) ON DELETE CASCADE ON UPDATE CASCADE
    );