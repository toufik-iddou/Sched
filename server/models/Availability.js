const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  start: { type: String, required: true }, // e.g. '09:00'
  end: { type: String, required: true },   // e.g. '17:00'
  slotType: { type: String, default: 'General Meeting' }, // e.g. 'Client Meeting', 'Consultation'
  name: { type: String, lowercase: true, trim: true }, // e.g. 'client-meeting', 'consultation'
  slotId: { type: String, unique: true }, // unique identifier for this specific time slot
  duration: { type: Number, default: 30 }, // duration in minutes
}, {
  timestamps: true
});


availabilitySchema.index({ username: 1, name: 1,start:1 }, { unique: true });
// Generate unique slot ID before saving
availabilitySchema.pre('save', function(next) {
  ensureSlotId(this)
  next();
});
availabilitySchema.pre('insertMany', function(next, docs) {
  for (const d of docs) ensureSlotId(d);
  next();
});

const ensureSlotId = (doc) => {
  if (!doc.slotId) {
    // Create a unique slug from slotType and day/time
    const typeSlug = doc.slotType.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const timeSlug = `${doc.day.toLowerCase()}-${doc.start.replace(':', '')}-${doc.end.replace(':', '')}`;
    doc.slotId = `${typeSlug}-${timeSlug}-${Date.now()}`;
    doc.name = doc.slotType.toLowerCase()
    .trim()                    
    .replace(/[^\w\s-]/g, '')  
    .replace(/\s+/g, '-')  
    .replace(/-+/g, '-');  
  }
}

module.exports = mongoose.model('Availability', availabilitySchema); 