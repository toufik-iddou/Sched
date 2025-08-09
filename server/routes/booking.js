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
    const timeStr = new Date(start).toLocaleString();
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