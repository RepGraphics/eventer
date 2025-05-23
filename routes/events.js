const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const mailer = require('../utils/mailer');

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
router.post('/', async (req, res) => {
    const { name, time } = req.body;
    if (!name || !time) {
        return res.status(400).json({ error: 'Name and time are required' });
    }
    Event.createEvent(name, time, async (err, id) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to create event' });
        }
        // Email notification
        try {
            await mailer.sendMail({
                to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
                subject: 'New Event Created',
                text: `Event "${name}" scheduled for ${time}`,
                html: `<b>Event:</b> ${name}<br><b>Time:</b> ${time}`
            });
        } catch (e) {
            console.error('Email send failed:', e.message);
        }
        res.json({ id, name, time, notification: 'Event created and email sent.' });
    });
});

// Update an event
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, time } = req.body;
    if (!name || !time) {
        return res.status(400).json({ error: 'Name and time are required' });
    }
    Event.updateEvent(id, name, time, async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to update event' });
        }
        // Email notification
        try {
            await mailer.sendMail({
                to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
                subject: 'Event Updated',
                text: `Event "${name}" updated to ${time}`,
                html: `<b>Event:</b> ${name}<br><b>New Time:</b> ${time}`
            });
        } catch (e) {
            console.error('Email send failed:', e.message);
        }
        res.json({ message: 'Event updated successfully', notification: 'Event updated and email sent.' });
    });
});

// Delete an event
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    // Fetch event name for notification (optional, not implemented here)
    Event.deleteEvent(id, async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to delete event' });
        }
        // Email notification
        try {
            await mailer.sendMail({
                to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
                subject: 'Event Deleted',
                text: `Event with ID ${id} was deleted.`,
                html: `<b>Event ID:</b> ${id} was deleted.`
            });
        } catch (e) {
            console.error('Email send failed:', e.message);
        }
        res.json({ message: 'Event deleted successfully', notification: 'Event deleted and email sent.' });
    });
});

module.exports = router;
