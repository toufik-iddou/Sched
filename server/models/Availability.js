const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  start: { type: String, required: true }, // e.g. '09:00'
  end: { type: String, required: true },   // e.g. '17:00'
});

module.exports = mongoose.model('Availability', availabilitySchema); 