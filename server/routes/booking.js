const express = require('express');
const User = require('../models/User');
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { createCalendarEvent, createMockCalendarEvent } = require('../utils/googleCalendar');
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

  // Google Calendar integration with fallback
  let eventId = '', meetLink = '', eventUrl = '', calendarSuccess = false;
  try {
    // Try to create real calendar event first
    const event = await createCalendarEvent({
      hostEmail: user.email,
      guestEmail,
      start,
      end,
      summary: `Meeting with ${guestName}`,
      description: `Meeting between ${user.name} and ${guestName}`,
      accessToken: user.googleAccessToken // Assuming you store this in user model
    });

    if (event.success) {
      eventId = event.eventId;
      meetLink = event.meetLink;
      eventUrl = event.eventUrl;
      calendarSuccess = true;
      console.log('Calendar event created successfully');
    } else {
      console.log('Calendar event creation failed, using fallback:', event.error);
    }
  } catch (e) {
    console.log('Calendar integration error, using fallback:', e.message);
  }

  // Use fallback if calendar creation failed
  if (!calendarSuccess) {
    try {
      const fallbackEvent = await createMockCalendarEvent({
        hostEmail: user.email,
        guestEmail,
        start,
        end,
        summary: `Meeting with ${guestName}`
      });
      eventId = fallbackEvent.eventId;
      meetLink = fallbackEvent.meetLink;
      eventUrl = fallbackEvent.eventUrl;
      console.log('Using fallback calendar event');
    } catch (e) {
      console.log('Fallback calendar event also failed:', e.message);
    }
  }

  const booking = await Booking.create({
    host: user._id,
    guestName,
    guestEmail,
    start,
    end,
    googleEventId: eventId,
    meetLink
  });

  // Email notifications with improved error handling
  const emailResults = { host: null, guest: null };
  
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

    const duration = Math.round((new Date(end) - new Date(start)) / (1000 * 60));
    
    // Create HTML email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Meeting Confirmation</h2>
        <p><strong>Host:</strong> ${user.name}</p>
        <p><strong>Guest:</strong> ${guestName}</p>
        <p><strong>Date & Time:</strong> ${timeStr}</p>
        <p><strong>Duration:</strong> ${duration} minutes</p>
        <p><strong>Meeting Link:</strong> <a href="${meetLink}" style="color: #007bff;">${meetLink}</a></p>
        ${eventUrl ? `<p><strong>Calendar Event:</strong> <a href="${eventUrl}" style="color: #007bff;">View in Calendar</a></p>` : ''}
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 14px;">This meeting was scheduled through Codtoop Calendar.</p>
      </div>
    `;

    // Send email to host
    emailResults.host = await sendBookingEmail({
      to: user.email,
      subject: `New Booking: ${guestName} - ${timeStr}`,
      text: `You have a new booking with ${guestName} (${guestEmail}) at ${timeStr}. Meet link: ${meetLink}`,
      html: htmlContent
    });

    // Send email to guest
    emailResults.guest = await sendBookingEmail({
      to: guestEmail,
      subject: `Booking Confirmed: ${user.name} - ${timeStr}`,
      text: `Your meeting with ${user.name} is confirmed for ${timeStr}. Meet link: ${meetLink}`,
      html: htmlContent
    });

    console.log('Email results:', emailResults);
  } catch (e) {
    console.error('Email sending failed:', e);
    emailResults.error = e.message;
  }

  res.json({
    booking,
    calendar: {
      success: calendarSuccess,
      eventId,
      meetLink,
      eventUrl
    },
    emails: emailResults
  });
});

// Test endpoint for debugging email and calendar
router.post('/test', async (req, res) => {
  try {
    const { testEmail, testCalendar } = req.body;
    const results = {};

    // Test email functionality
    if (testEmail) {
      const { testEmail } = require('../utils/email');
      results.email = await testEmail();
    }

    // Test calendar functionality
    if (testCalendar) {
      const { createMockCalendarEvent } = require('../utils/googleCalendar');
      results.calendar = await createMockCalendarEvent({
        hostEmail: 'test@example.com',
        guestEmail: 'guest@example.com',
        start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        end: new Date(Date.now() + 25 * 60 * 60 * 1000),   // Tomorrow + 1 hour
        summary: 'Test Meeting'
      });
    }

    res.json({
      success: true,
      message: 'Test completed',
      results,
      environment: {
        hasEmailConfig: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
        hasGoogleConfig: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 