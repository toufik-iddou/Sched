const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  start: { type: String, required: true }, // e.g. '09:00'
  end: { type: String, required: true },   // e.g. '17:00'
  slotType: { type: String, default: 'General Meeting' }, // e.g. 'Client Meeting', 'Consultation'
  slotId: { type: String, unique: true }, // unique identifier for this specific time slot
  duration: { type: Number, default: 30 }, // duration in minutes
}, {
  timestamps: true
});

// Generate unique slot ID before saving
availabilitySchema.pre('save', function(next) {
  if (!this.slotId) {
    // Create a unique slug from slotType and day/time
    const typeSlug = this.slotType.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timeSlug = `${this.day.toLowerCase()}-${this.start.replace(':', '')}-${this.end.replace(':', '')}`;
    this.slotId = `${typeSlug}-${timeSlug}-${Date.now()}`;
  }
  next();
});

module.exports = mongoose.model('Availability', availabilitySchema); 