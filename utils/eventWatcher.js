require('dotenv').config();
const APP_URL = process.env.APP_URL || 'http://localhost:8080';

const path = require('path');
const Event = require(path.join(__dirname, '../models/Event'));
const mailer = require(path.join(__dirname, '../utils/mailer'));
const discord = require(path.join(__dirname, '../utils/discord'));
const fs = require('fs');

const settingsPath = path.join(__dirname, '../data/user-settings.json');
let notifiedEvents = new Set();

function getAllUsers() {
  if (!fs.existsSync(settingsPath)) return [];
  return Object.keys(JSON.parse(fs.readFileSync(settingsPath, 'utf8')));
}

function getUserSettings(username) {
  if (!fs.existsSync(settingsPath)) return {};
  const all = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  return all[username] || {};
}

async function checkAndNotify() {
  Event.getAllEvents(async (err, events) => {
    if (err || !Array.isArray(events)) return;
    const now = new Date();
    for (const event of events) {
      const eventTime = new Date(event.time);
      const eventTimeFormatted = new Date(event.time).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
      });
      // Send reminder 5 minutes before event
      const reminderTime = new Date(eventTime.getTime() - 5 * 60 * 1000);
      const reminderKey = `reminder-${event.id}`;
      if (reminderTime <= now && !event.reminder_sent) {
        for (const username of getAllUsers()) {
          const settings = getUserSettings(username);
          // Email reminder
          if (settings.smtp_enabled) {
            try {
              await mailer.sendMail({
                subject: 'Event Reminder',
                text: `Reminder: Event "${event.name}" starts in 5 minutes!`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                    <div style="background:#3b82f6; color:#fff; padding:16px 24px; font-size:20px; font-weight:bold;">
                      Eventer Notification
                    </div>
                    <div style="padding:24px 24px 16px 24px;">
                      <h2 style="margin:0 0 12px 0; color:#1e293b;">🔔 Event Reminder</h2>
                      <p style="margin:0 0 8px 0; font-size:16px;">This is a reminder that your event is starting soon.</p>
                      <table style="width:100%; font-size:15px; margin:16px 0;">
                        <tr><td style="color:#64748b;">Event:</td><td><b>${event.name}</b></td></tr>
                        <tr><td style="color:#64748b;">Time:</td><td>${eventTimeFormatted}</td></tr>
                      </table>
                      <p style="margin:0; color:#64748b; font-size:13px;">You are receiving this because you enabled reminders in your Eventer settings.</p>
                    </div>
                    <div style="background:#f1f5f9; color:#64748b; text-align:center; padding:12px 0; font-size:13px;">
                      <img src="${APP_URL}/public/images/icon.webp" alt="Eventer" style="height:20px; vertical-align:middle; margin-right:6px;"> Eventer &copy; 2025
                    </div>
                  </div>
                `,
                username
              });
            } catch (e) {
              if (!/not enabled|not configured/.test(e.message)) {
                console.error(`[${username}] Email reminder failed:`, e.message);
              }
            }
          }
          // Discord reminder
          if (settings.discord_enabled) {
            try {
              const unixTime = Math.floor(eventTime.getTime() / 1000);
              await discord.sendDiscordWebhook({
                embed: {
                  title: '🔔 Event Reminder',
                  description: `**Event:** ${event.name}\n**Starts:** <t:${unixTime}:F> (<t:${unixTime}:R>)`,
                  color: 0x3b82f6,
                  thumbnail: {
                    url: `${APP_URL}/public/images/logo-t.webp`
                  },
                  footer: {
                    text: 'Eventer Notification',
                    icon_url: `${APP_URL}/public/images/icon.webp`
                  },
                  timestamp: new Date().toISOString()
                },
                username
              });
            } catch (e) {
              if (!/not enabled|not configured/.test(e.message)) {
                console.error(`[${username}] Discord reminder failed:`, e.message);
              }
            }
          }
        }
        Event.markEventReminded(event.id, () => {});
      }
      // Notify all users with notifications enabled
      if (eventTime <= now && !event.sent) {
        for (const username of getAllUsers()) {
          const settings = getUserSettings(username);
          // Email
          if (settings.smtp_enabled) {
            try {
              await mailer.sendMail({
                subject: 'Event Started',
                text: `Event "${event.name}" is starting now!`,
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                    <div style="background:#22c55e; color:#fff; padding:16px 24px; font-size:20px; font-weight:bold;">
                      Eventer Notification
                    </div>
                    <div style="padding:24px 24px 16px 24px;">
                      <h2 style="margin:0 0 12px 0; color:#1e293b;">⏰ Event Started</h2>
                      <p style="margin:0 0 8px 0; font-size:16px;">Your event is starting now.</p>
                      <table style="width:100%; font-size:15px; margin:16px 0;">
                        <tr><td style="color:#64748b;">Event:</td><td><b>${event.name}</b></td></tr>
                        <tr><td style="color:#64748b;">Time:</td><td>${eventTimeFormatted}</td></tr>
                      </table>
                      <p style="margin:0; color:#64748b; font-size:13px;">You are receiving this because you enabled notifications in your Eventer settings.</p>
                    </div>
                    <div style="background:#f1f5f9; color:#64748b; text-align:center; padding:12px 0; font-size:13px;">
                      <img src="${APP_URL}/public/images/icon.webp" alt="Eventer" style="height:20px; vertical-align:middle; margin-right:6px;"> Eventer &copy; 2025
                    </div>
                  </div>
                `,
                username
              });
            } catch (e) {
              if (!/not enabled|not configured/.test(e.message)) {
                console.error(`[${username}] Email send failed:`, e.message);
              }
            }
          }
          // Discord
          if (settings.discord_enabled) {
            try {
              const unixTime = Math.floor(new Date(event.time).getTime() / 1000);
              await discord.sendDiscordWebhook({
                embed: {
                  title: '⏰ Event Started',
                  description: `**Event:** ${event.name}\n**Started:** <t:${unixTime}:F> (<t:${unixTime}:R>)`,
                  color: 0x22c55e,
                  thumbnail: {
                    url: `${APP_URL}/public/images/logo-t.webp`
                  },
                  footer: {
                    text: 'Eventer Notification',
                    icon_url: `${APP_URL}/public/images/icon.webp`
                  },
                  timestamp: new Date().toISOString()
                },
                username
              });
            } catch (e) {
              if (!/not enabled|not configured/.test(e.message)) {
                console.error(`[${username}] Discord webhook failed:`, e.message);
              }
            }
          }
        }
        Event.markEventSent(event.id, () => {});
      }
    }
  });
}

setInterval(checkAndNotify, 1000);
console.log('Event notification watcher started.');
