const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, './data/events.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err);
        process.exit(1);
    }
});

db.serialize(() => {
    db.all("PRAGMA table_info(events);", (err, columns) => {
        if (err) {
            console.error('Could not get table info:', err);
            db.close();
            return;
        }
        const hasCreatedAt = columns.some(col => col.name === 'created_at');
        if (!hasCreatedAt) {
            db.run("ALTER TABLE events ADD COLUMN created_at TEXT", (err) => {
                if (err) {
                    console.error('Error adding created_at column:', err);
                } else {
                    console.log('created_at column added.');
                }
                // Backfill all rows
                db.run("UPDATE events SET created_at = datetime('now') WHERE created_at IS NULL", (err) => {
                    if (err) {
                        console.error('Error backfilling created_at:', err);
                    } else {
                        console.log('Backfilled created_at for all existing events.');
                    }
                    db.close();
                });
            });
        } else {
            // Backfill just in case
            db.run("UPDATE events SET created_at = datetime('now') WHERE created_at IS NULL", (err) => {
                if (err) {
                    console.error('Error backfilling created_at:', err);
                } else {
                    console.log('Backfilled created_at for all existing events.');
                }
                db.close();
            });
        }
    });
});
