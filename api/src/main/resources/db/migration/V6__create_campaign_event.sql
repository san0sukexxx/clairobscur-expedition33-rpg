CREATE TABLE
    campaign_event (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        campaign_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        event_value TEXT
    );