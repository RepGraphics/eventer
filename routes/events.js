require('dotenv').config();
const APP_URL = process.env.APP_URL || 'http://localhost:8080';

const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const mailer = require('../utils/mailer');
const discord = require('../utils/discord');

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
        res.json({ id, name, time, notification: 'Event created and notifications sent.' });
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

module.exports = router;
