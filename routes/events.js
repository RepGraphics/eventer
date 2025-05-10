const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Get all events
router.get('/', (req, res) => {
    Event.getAllEvents((err, events) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch events' });
        }
        res.json(events);
    });
});

// Create a new event
router.post('/', (req, res) => {
    const { name, time } = req.body;
    if (!name || !time) {
        return res.status(400).json({ error: 'Name and time are required' });
    }
    Event.createEvent(name, time, (err, id) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to create event' });
        }
        res.json({ id, name, time });
    });
});

// Update an event
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { name, time } = req.body;
    if (!name || !time) {
        return res.status(400).json({ error: 'Name and time are required' });
    }
    Event.updateEvent(id, name, time, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to update event' });
        }
        res.json({ message: 'Event updated successfully' });
    });
});

// Delete an event
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    Event.deleteEvent(id, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete event' });
        }
        res.json({ message: 'Event deleted successfully' });
    });
});

module.exports = router;
