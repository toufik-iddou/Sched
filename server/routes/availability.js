const express = require('express');
const Availability = require('../models/Availability');
const { authenticateJWT } = require('./user');

const router = express.Router();

// Helper function to generate time slots from a range
function generateTimeSlots(startTime, endTime, intervalMinutes) {
  const slots = [];
  const start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);
  
  let current = new Date(start);
  while (current < end) {
    const slotStart = current.toTimeString().slice(0, 5);
    current.setMinutes(current.getMinutes() + intervalMinutes);
    const slotEnd = current.toTimeString().slice(0, 5);
    
    if (current <= end) {
      slots.push({ start: slotStart, end: slotEnd });
    }
  }
  
  return slots;
}

// Get current user's availability
router.get('/', authenticateJWT, async (req, res) => {
  const slots = await Availability.find({ user: req.userId });
  res.json(slots);
});

// Get availability grouped by slot types
router.get('/grouped', authenticateJWT, async (req, res) => {
  const slots = await Availability.find({ user: req.userId });
  
  // Group slots by slotType
  const grouped = slots.reduce((acc, slot) => {
    if (!acc[slot.slotType]) {
      acc[slot.slotType] = [];
    }
    acc[slot.slotType].push(slot);
    return acc;
  }, {});
  
  res.json(grouped);
});

// Bulk create availability slots (Calendly-style)
router.post('/bulk', authenticateJWT, async (req, res) => {
  try {
    const { 
      days, // array of day names ['Saturday', 'Sunday']
      timeRanges, // array of {start, end} objects for each day
      interval, // interval in minutes (15, 30, 45, 60)
      slotType // name like 'Client Meeting'
    } = req.body;

    if (!days || !timeRanges || !interval || !slotType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Delete existing slots for this user and slot type
    await Availability.deleteMany({ user: req.userId, slotType });

    const slotsToCreate = [];

    // Generate slots for each selected day
    for (const day of days) {
      for (const range of timeRanges) {
        const timeSlots = generateTimeSlots(range.start, range.end, interval);
        
        for (const timeSlot of timeSlots) {
          slotsToCreate.push({
            user: req.userId,
            day,
            start: timeSlot.start,
            end: timeSlot.end,
            slotType,
            duration: interval
          });
        }
      }
    }

    // Create all slots
    const createdSlots = await Availability.insertMany(slotsToCreate);
    
    res.json({ 
      message: `Created ${createdSlots.length} time slots for ${slotType}`,
      slots: createdSlots,
      count: createdSlots.length
    });

  } catch (error) {
    console.error('Error creating bulk slots:', error);
    res.status(500).json({ message: 'Failed to create slots' });
  }
});

// Set or update availability for a day (legacy endpoint)
router.post('/', authenticateJWT, async (req, res) => {
  const { day, start, end, slotType = 'General Meeting' } = req.body;
  if (!day || !start || !end) return res.status(400).json({ message: 'Missing fields' });
  
  let slot = await Availability.findOneAndUpdate(
    { user: req.userId, day, start, end },
    { slotType },
    { new: true, upsert: true }
  );
  res.json(slot);
});

// Delete availability by slot ID
router.delete('/slot/:slotId', authenticateJWT, async (req, res) => {
  await Availability.findOneAndDelete({ 
    user: req.userId, 
    slotId: req.params.slotId 
  });
  res.json({ success: true });
});

// Delete all slots for a slot type
router.delete('/type/:slotType', authenticateJWT, async (req, res) => {
  const result = await Availability.deleteMany({ 
    user: req.userId, 
    slotType: req.params.slotType 
  });
  res.json({ success: true, deletedCount: result.deletedCount });
});

// Delete availability for a day (legacy endpoint)
router.delete('/:day', authenticateJWT, async (req, res) => {
  await Availability.findOneAndDelete({ user: req.userId, day: req.params.day });
  res.json({ success: true });
});

module.exports = router; 