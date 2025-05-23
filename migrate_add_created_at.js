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
    db.run("ALTER TABLE events ADD COLUMN created_at TEXT DEFAULT (datetime('now'))", (err) => {
        if (err && !err.message.includes('duplicate column')) {
            console.error('Migration failed:', err.message);
        } else {
            console.log('Migration successful or column already exists.');
        }
        db.close();
    });
});
