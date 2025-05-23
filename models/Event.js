const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to SQLite database
const dbPath = path.resolve(__dirname, '../data/events.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err);
    } else {
        console.log('Connected to SQLite database.');
    }
});

// Create events table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    time TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sent INTEGER DEFAULT 0,
    reminder_sent INTEGER DEFAULT 0
)`);

// Add 'sent' and 'reminder_sent' columns if not exist
// This is a one-time migration
const alterTable = `ALTER TABLE events ADD COLUMN sent INTEGER DEFAULT 0`;
db.run(alterTable, (err) => {
    if (err && !/duplicate column name/i.test(err.message)) {
        console.error('Error adding sent column:', err.message);
    }
});
const alterTable2 = `ALTER TABLE events ADD COLUMN reminder_sent INTEGER DEFAULT 0`;
db.run(alterTable2, (err) => {
    if (err && !/duplicate column name/i.test(err.message)) {
        console.error('Error adding reminder_sent column:', err.message);
    }
});

module.exports = {
    getAllEvents: (callback) => {
        db.all('SELECT * FROM events', [], (err, rows) => {
            if (err) {
                console.error('Error fetching events:', err);
            } else {
                console.log('Fetched events:', rows);
            }
            callback(err, rows);
        });
    },

    createEvent: (name, time, callback) => {
        db.run('INSERT INTO events (name, time, created_at) VALUES (?, ?, datetime("now"))', [name, time], function (err) {
            if (err) {
                console.error('Error inserting event:', err);
            } else {
                console.log('Inserted event with ID:', this.lastID);
            }
            callback(err, this.lastID);
        });
    },

    updateEvent: (id, name, time, callback) => {
        db.run('UPDATE events SET name = ?, time = ?, sent = 0, reminder_sent = 0 WHERE id = ?', [name, time, id], (err) => {
            callback(err);
        });
    },

    deleteEvent: (id, callback) => {
        db.run('DELETE FROM events WHERE id = ?', [id], (err) => {
            callback(err);
        });
    },

    getUnsentEvents: (callback) => {
        db.all('SELECT * FROM events WHERE sent = 0', [], callback);
    },
    markEventSent: (id, callback) => {
        db.run('UPDATE events SET sent = 1 WHERE id = ?', [id], callback);
    },
    getUnremindedEvents: (callback) => {
        db.all('SELECT * FROM events WHERE reminder_sent = 0', [], callback);
    },
    markEventReminded: (id, callback) => {
        db.run('UPDATE events SET reminder_sent = 1 WHERE id = ?', [id], callback);
    }
};
