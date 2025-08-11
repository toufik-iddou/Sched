const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  
  // Google Calendar integration fields
  googleAccessToken: { type: String },
  googleRefreshToken: { type: String },
  googleTokenExpiry: { type: Date },
  googleCalendarConnected: { type: Boolean, default: false },
  
  // Additional user preferences
  timezone: { type: String, default: 'UTC' },
  defaultMeetingDuration: { type: Number, default: 30 }, // in minutes
});

module.exports = mongoose.model('User', userSchema); 