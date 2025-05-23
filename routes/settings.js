const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// For demo: store settings in a JSON file per user (in production, use a DB)
const settingsPath = path.join(__dirname, '../data/user-settings.json');

function getSettings(username) {
  if (!fs.existsSync(settingsPath)) return {};
  const all = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  return all[username] || {};
}
function saveSettings(username, settings) {
  let all = {};
  if (fs.existsSync(settingsPath)) all = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  all[username] = settings;
  fs.writeFileSync(settingsPath, JSON.stringify(all, null, 2));
}

// Get settings
router.get('/', (req, res) => {
  const username = req.session.user;
  res.json(getSettings(username));
});

// Save settings
router.post('/', (req, res) => {
  const username = req.session.user;
  saveSettings(username, req.body);
  res.json({ msg: 'Settings saved' });
});

module.exports = router;
