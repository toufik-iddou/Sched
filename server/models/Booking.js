const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  host: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  guestName: { type: String, required: true },
  guestEmail: { type: String, required: true },
  start: { type: Date, required: true },
  end: { type: Date, required: true },
  googleEventId: { type: String },
  meetLink: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Booking', bookingSchema); 