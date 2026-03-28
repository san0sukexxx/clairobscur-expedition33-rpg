-- SQLite doesn't support DROP COLUMN directly before 3.35.0
-- Recreate table without name column
CREATE TABLE encounter_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    location_id TEXT,
    FOREIGN KEY (campaign_id) REFERENCES campaign (id) ON DELETE CASCADE
);

INSERT INTO encounter_new (id, campaign_id, location_id)
SELECT id, campaign_id, location_id FROM encounter;

DROP TABLE encounter;
ALTER TABLE encounter_new RENAME TO encounter;
