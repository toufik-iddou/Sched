const express = require('express');
const User = require('../models/User');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { createCalendarEvent } = require('../utils/googleCalendar');
const { sendBookingEmail } = require('../utils/email');

const router = express.Router();

// Get host's public availability (by username)
router.get('/availability/:username', async (req, res) => {
  console.log(req.params.username)
  const user = await User.findOne({ name: req.params.username });
  if (!user) return res.status(404).json({ message: 'Host not found' });
  const slots = await Availability.find({ user: user._id });
  res.json({ host: { name: user.name, avatar: user.avatar }, slots });
});

// Get host's public availability by slot type (by username and slot type)
router.get('/availability/:username/:slotType', async (req, res) => {
  const user = await User.findOne({ name: req.params.username });
  if (!user) return res.status(404).json({ message: 'Host not found' });
  
  const slotType = req.params.slotType
  const slots = await Availability.find({ user: user._id, slotType });
  
  if (slots.length === 0) {
    return res.status(404).json({ message: 'Slot type not found' });
  }
  
  res.json({ 
    host: { name: user.name, avatar: user.avatar }, 
    slots,
    slotType
  });
});

// Get all slot types for a host
router.get('/slot-types/:username', async (req, res) => {
  const user = await User.findOne({ name: req.params.username });
  if (!user) return res.status(404).json({ message: 'Host not found' });
  
  const slots = await Availability.find({ user: user._id });
  const slotTypes = [...new Set(slots.map(slot => slot.slotType))];
  
  res.json({ 
    host: { name: user.name, avatar: user.avatar },
    slotTypes: slotTypes.map(type => ({
      name: type,
      slug: type.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      count: slots.filter(slot => slot.slotType === type).length
    }))
  });
});

// Get all bookings for a host (for conflict checking)
router.get('/host/:username/bookings', async (req, res) => {
  const user = await User.findOne({ name: req.params.username });
  if (!user) return res.status(404).json({ message: 'Host not found' });
  const bookings = await Booking.find({ host: user._id });
  res.json(bookings);
});

// Create a booking
router.post('/book/:username', async (req, res) => {
  const { guestName, guestEmail, start, end } = req.body;
  if (!guestName || !guestEmail || !start || !end) return res.status(400).json({ message: 'Missing fields' });
  const user = await User.findOne({ name: req.params.username });
  if (!user) return res.status(404).json({ message: 'Host not found' });

  // Prevent double booking
  const overlap = await Booking.findOne({
    host: user._id,
    $or: [
      { start: { $lt: new Date(end), $gte: new Date(start) } },
      { end: { $gt: new Date(start), $lte: new Date(end) } },
      { start: { $lte: new Date(start) }, end: { $gte: new Date(end) } }
    ]
  });
  if (overlap) return res.status(409).json({ message: 'Time slot already booked' });

  // Google Calendar integration
  let eventId = '', meetLink = '';
  try {
    const event = await createCalendarEvent({
      hostEmail: user.email,
      guestEmail,
      start,
      end,
      summary: `Meeting with ${guestName}`
    });
    eventId = event.eventId;
    meetLink = event.meetLink;
  } catch (e) { /* fallback to no event */ }

  const booking = await Booking.create({
    host: user._id,
    guestName,
    guestEmail,
    start,
    end,
    googleEventId: eventId,
    meetLink
  });

  // Email notifications
  try {
    // Format time in a more user-friendly way with timezone info
    const timeStr = new Date(start).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    });
    await sendBookingEmail({
      to: user.email,
      subject: 'New Booking Received',
      text: `You have a new booking with ${guestName} (${guestEmail}) at ${timeStr}. Meet link: ${meetLink}`
    });
    await sendBookingEmail({
      to: guestEmail,
      subject: 'Booking Confirmed',
      text: `Your meeting with ${user.name} is confirmed for ${timeStr}. Meet link: ${meetLink}`
    });
  } catch (e) { /* ignore email errors */ }

  res.json(booking);
});

module.exports = router; 