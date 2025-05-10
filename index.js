const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Set view engine to EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from 'public'
app.use('/public', express.static(path.join(__dirname, 'public')));

// Route `/` renders index.ejs
app.get('/', (req, res) => {
  res.render('index');
});

// Route `/dashboard` renders dashboard.ejs
app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

app.use('/api/events', require('./routes/events'));
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
