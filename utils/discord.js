const fs = require('fs');
const path = require('path');
const https = require('https');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const settingsPath = path.join(__dirname, '../data/user-settings.json');

function getUserDiscordSettings(username) {
  if (!fs.existsSync(settingsPath)) return null;
  const all = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  return all[username] || null;
}

async function sendDiscordWebhook({ content, embed, username }) {
  let discordSettings = getUserDiscordSettings(username);
  if (!discordSettings || !discordSettings.discord_enabled || !discordSettings.discord_webhook) {
    throw new Error('Discord webhook not enabled or not configured for this user');
  }
  const webhookUrl = discordSettings.discord_webhook;
  const body = embed
    ? { embeds: [embed] }
    : { content };
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    agent: new https.Agent({ rejectUnauthorized: false }) // Accept self-signed certs if needed
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord webhook failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res;
}

module.exports = { sendDiscordWebhook };
