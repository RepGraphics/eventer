require('dotenv').config();
const APP_URL = process.env.APP_URL;

const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const mailer = require('../utils/mailer');
const discord = require('../utils/discord');

// Add a simple in-memory category list for now
let categories = [];

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
    const { name, time, category } = req.body;
    if (!name || !time) {
        return res.status(400).json({ error: 'Name and time are required' });
    }
    Event.createEvent(name, time, category || '', async (err, id) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to create event' });
        }
        // Email notification
        if (mailer && mailer.sendMail) {
          try {
            await mailer.sendMail({
              subject: 'New Event Created',
              text: `Event "${name}" scheduled for ${time}`,
              html: `<b>Event:</b> ${name}<br><b>Time:</b> ${time}`,
              username: req.session.user
            });
          } catch (e) {
            if (!/not enabled|not configured/.test(e.message)) {
              console.error('Email send failed:', e.message);
            }
          }
        }
        // Discord notification
        if (discord && discord.sendDiscordWebhook) {
          try {
            // Discord timestamp: <t:unix:REL>
            const unixTime = Math.floor(new Date(time).getTime() / 1000);
            await discord.sendDiscordWebhook({
              embed: {
                title: '📅 New Event Created',
                description: `**Event:** ${name}\n**Time:** <t:${unixTime}:F> (<t:${unixTime}:R>)`,
                color: 0x2563eb,
                thumbnail: {
                  url: `${APP_URL}/public/images/logo-t.webp`
                },
                footer: {
                  text: 'Eventer Notification',
                  icon_url: `${APP_URL}/public/images/icon.webp`
                },
                timestamp: new Date().toISOString()
              },
              username: req.session.user
            });
          } catch (e) {
            if (!/not enabled|not configured/.test(e.message)) {
              console.error('Discord webhook failed:', e.message);
            }
          }
        }
        res.json({ id, name, time, category, notification: 'Event created and notifications sent.' });
    });
});

// Update an event
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, time, category } = req.body;
    if (!name || !time) {
        return res.status(400).json({ error: 'Name and time are required' });
    }
    Event.updateEvent(id, name, time, category || '', async (err) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to update event' });
        }
        // Email notification
        if (mailer && mailer.sendMail) {
          try {
            await mailer.sendMail({
              subject: 'Event Updated',
              text: `Event "${name}" updated to ${time}`,
              html: `<b>Event:</b> ${name}<br><b>New Time:</b> ${time}`,
              username: req.session.user
            });
          } catch (e) {
            if (!/not enabled|not configured/.test(e.message)) {
              console.error('Email send failed:', e.message);
            }
          }
        }
        // Discord notification
        if (discord && discord.sendDiscordWebhook) {
          try {
            const unixTime = Math.floor(new Date(time).getTime() / 1000);
            await discord.sendDiscordWebhook({
              embed: {
                title: '✏️ Event Updated',
                description: `**Event:** ${name}\n**New Time:** <t:${unixTime}:F> (<t:${unixTime}:R>)`,
                color: 0xfbbf24,
                thumbnail: {
                  url: `${APP_URL}/public/images/logo-t.webp`
                },
                footer: {
                  text: 'Eventer Notification',
                  icon_url: `${APP_URL}/public/images/icon.webp`
                },
                timestamp: new Date().toISOString()
              },
              username: req.session.user
            });
          } catch (e) {
            if (!/not enabled|not configured/.test(e.message)) {
              console.error('Discord webhook failed:', e.message);
            }
          }
        }
        res.json({ message: 'Event updated successfully', notification: 'Event updated and notifications sent.' });
    });
});

// Delete an event
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    // Fetch event name before deleting
    Event.getAllEvents((err, events) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch events for delete' });
        }
        const event = events.find(e => String(e.id) === String(id));
        const eventName = event ? event.name : undefined;
        Event.deleteEvent(id, async (err) => {
            if (err) {
                return res.status(500).json({ error: 'Failed to delete event' });
            }
            // Email notification
            if (mailer && mailer.sendMail) {
              try {
                await mailer.sendMail({
                  subject: 'Event Deleted',
                  text: eventName ? `Event "${eventName}" (ID ${id}) was deleted.` : `Event with ID ${id} was deleted.`,
                  html: eventName ? `<b>Event:</b> ${eventName}<br><b>Event ID:</b> ${id} was deleted.` : `<b>Event ID:</b> ${id} was deleted.`,
                  username: req.session.user
                });
              } catch (e) {
                if (!/not enabled|not configured/.test(e.message)) {
                  console.error('Email send failed:', e.message);
                }
              }
            }
            // Discord notification
            if (discord && discord.sendDiscordWebhook) {
              try {
                await discord.sendDiscordWebhook({
                  embed: {
                    title: '🗑️ Event Deleted',
                    description: eventName ? `**Event:** ${eventName}\n**Event ID:** ${id} was deleted.` : `**Event ID:** ${id} was deleted.`,
                    color: 0xef4444,
                    thumbnail: {
                      url: `${APP_URL}/public/images/logo-t.webp`
                    },
                    footer: {
                      text: 'Eventer Notification',
                      icon_url: `${APP_URL}/public/images/icon.webp`
                    },
                    timestamp: new Date().toISOString()
                  },
                  username: req.session.user
                });
              } catch (e) {
                if (!/not enabled|not configured/.test(e.message)) {
                  console.error('Discord webhook failed:', e.message);
                }
              }
            }
            res.json({ message: 'Event deleted successfully', notification: 'Event deleted and notifications sent.' });
        });
    });
});

// Get all categories
router.get('/categories', (req, res) => {
    res.json(categories);
});

// Add a new category
router.post('/categories', (req, res) => {
    const { name } = req.body;
    if (!name || categories.includes(name)) {
        return res.status(400).json({ error: 'Invalid or duplicate category' });
    }
    categories.push(name);
    res.json({ success: true, categories });
});

// Delete a category
router.delete('/categories/:name', (req, res) => {
    const name = req.params.name;
    if (!name) {
        return res.status(400).json({ error: 'Invalid category' });
    }
    // Remove from in-memory list
    categories = categories.filter(cat => cat !== name);
    // Move all events in this category to null (no category)
    const Event = require('../models/Event');
    Event.getAllEvents((err, events) => {
        if (err) return res.status(500).json({ error: 'Failed to update events' });
        const toUpdate = events.filter(ev => ev.category === name);
        let updated = 0;
        if (toUpdate.length === 0) return res.json({ success: true, categories });
        toUpdate.forEach(ev => {
            Event.updateEvent(ev.id, ev.name, ev.time, null, () => {
                updated++;
                if (updated === toUpdate.length) {
                    res.json({ success: true, categories });
                }
            });
        });
    });
});

// Update only the category of an event
router.put('/:id/category', async (req, res) => {
    const { id } = req.params;
    const { category } = req.body;
    if (typeof category !== 'string') {
        return res.status(400).json({ error: 'Invalid category' });
    }
    Event.getAllEvents((err, events) => {
        if (err) return res.status(500).json({ error: 'Failed to fetch events' });
        const event = events.find(e => String(e.id) === String(id));
        if (!event) return res.status(404).json({ error: 'Event not found' });
        Event.updateEvent(id, event.name, event.time, category, (err) => {
            if (err) return res.status(500).json({ error: 'Failed to update category' });
            res.json({ success: true });
        });
    });
});

module.exports = router;
