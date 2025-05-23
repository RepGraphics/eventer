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
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

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
        db.run('UPDATE events SET name = ?, time = ? WHERE id = ?', [name, time, id], (err) => {
            callback(err);
        });
    },

    deleteEvent: (id, callback) => {
        db.run('DELETE FROM events WHERE id = ?', [id], (err) => {
            callback(err);
        });
    }
};
