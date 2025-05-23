const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const settingsPath = path.join(__dirname, '../data/user-settings.json');

function getUserSmtpSettings(username) {
  if (!fs.existsSync(settingsPath)) return null;
  const all = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  return all[username] || null;
}

async function sendMail({ to, subject, text, html, username }) {
  let smtpSettings = getUserSmtpSettings(username);
  if (!smtpSettings || !smtpSettings.smtp_enabled) {
    throw new Error('SMTP not enabled or not configured for this user');
  }
  const transporter = nodemailer.createTransport({
    host: smtpSettings.smtp_host,
    port: Number(smtpSettings.smtp_port),
    secure: Number(smtpSettings.smtp_port) === 465, // Use secure for port 465
    auth: {
      user: smtpSettings.smtp_user,
      pass: smtpSettings.smtp_pass,
    },
  });
  return transporter.sendMail({
    from: smtpSettings.smtp_user,
    to: to || smtpSettings.smtp_to,
    subject,
    text,
    html,
  });
}

module.exports = { sendMail };
