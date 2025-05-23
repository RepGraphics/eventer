const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
require('dotenv').config();

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = process.env.USER;
    if (!user) return res.status(400).json({ msg: 'Invalid credentials' });
    if (user !== username) return res.status(400).json({ msg: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, process.env.PASSWORD);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const payload = {
      user: {
        username: user
      }
    };

    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
      if (err) throw err;
      // Set session user for express-session
      req.session.user = user;
      res.json({ token });
    });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Logout route
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.json({ msg: 'Logged out' });
  });
});

module.exports = router;
