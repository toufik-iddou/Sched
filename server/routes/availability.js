const express = require('express');
const Availability = require('../models/Availability');
const { authenticateJWT } = require('./user');

const router = express.Router();

// Get current user's availability
router.get('/', authenticateJWT, async (req, res) => {
  const slots = await Availability.find({ user: req.userId });
  res.json(slots);
});

// Set or update availability for a day
router.post('/', authenticateJWT, async (req, res) => {
  const { day, start, end } = req.body;
  if (!day || !start || !end) return res.status(400).json({ message: 'Missing fields' });
  let slot = await Availability.findOneAndUpdate(
    { user: req.userId, day },
    { start, end },
    { new: true, upsert: true }
  );
  res.json(slot);
});

// Delete availability for a day
router.delete('/:day', authenticateJWT, async (req, res) => {
  await Availability.findOneAndDelete({ user: req.userId, day: req.params.day });
  res.json({ success: true });
});

module.exports = router; 