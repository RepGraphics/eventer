const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'public/views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.JWT_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true if using HTTPS
}));

// Auth middleware
function ensureSignedIn(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  // If API, send 401. If page, redirect to login
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Not signed in' });
  }
  res.redirect('/');
}

// Serve static files from 'public'
app.use('/public', express.static(path.join(__dirname, 'public')));

// Route `/` renders index.ejs
app.get('/', (req, res) => {
  res.render('index');
});

// Route `/dashboard` renders dashboard.ejs (protected)
app.get('/dashboard', ensureSignedIn, (req, res) => {
  res.render('dashboard', { username: req.session.user });
});

// Settings page (protected)
app.get('/settings', ensureSignedIn, (req, res) => {
  res.render('settings', { username: req.session.user });
});

// Auth routes (login sets session)
app.use('/api/auth', require('./routes/auth'));

// Events API (protected)
app.use('/api/events', ensureSignedIn, require('./routes/events'));

// Settings API (protected)
app.use('/api/settings', ensureSignedIn, require('./routes/settings'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Start the event watcher (runs in the same process)
require('./utils/eventWatcher');
