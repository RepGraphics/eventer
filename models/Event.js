const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  name: String,
  time: String,
  day: String,
  repeat: Boolean,
});

module.exports = mongoose.model('Event', EventSchema);
