const express = require('express');
const router = express.Router();

const events = []; // This can be changed to MongoDB later

router.post('/', (req, res) => {
  const { name, time, day, repeat, email } = req.body;

  if (!name || !time || !day) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  const newEvent = { name, time, day, repeat, email };
  events.push(newEvent);

  // (Optional) Send notification or save to DB

  res.json({ success: true, event: newEvent });
});

module.exports = router;
