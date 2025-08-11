const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Booking = require('../models/Booking');

const router = express.Router();

// Middleware to verify JWT and attach user to req
function authenticateJWT(req, res, next) {
console.log(req.headers.authorization)
const authHeader = req.headers.authorization;
if (authHeader && authHeader.startsWith('Bearer ')) {
  const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Invalid token' });
      req.userId = decoded.id;
      next();
    });
  } else {
    res.status(401).json({ message: 'No token provided' });
  }
}

// GET /user/me
router.get('/me', authenticateJWT, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-__v');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /user/bookings (host's upcoming bookings)
router.get('/bookings', authenticateJWT, async (req, res) => {
  try {
    const now = new Date();
    const bookings = await Booking.find({ host: req.userId, end: { $gte: now } }).sort('start');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth routes for calendar integration
const { getAuthUrl, getTokensFromCode } = require('../utils/googleCalendar');

// Get Google OAuth URL
router.get('/google-auth-url', (req, res) => {
  const authUrl = getAuthUrl();
  if (!authUrl) {
    return res.status(500).json({ 
      error: 'Google Calendar not configured. Check environment variables.' 
    });
  }
  res.json({ authUrl });
});

// Handle Google OAuth callback
router.get('/google-callback', async (req, res) => {
  const { code } = req.query;
  const { userId } = req.query; // You'll need to pass this from frontend

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    const tokens = await getTokensFromCode(code);
    if (!tokens) {
      return res.status(500).json({ error: 'Failed to get tokens' });
    }

    // Update user with Google access token
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token,
        googleTokenExpiry: tokens.expiry_date
      });
    }

    res.json({ 
      success: true, 
      message: 'Google Calendar connected successfully',
      hasAccessToken: !!tokens.access_token
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ error: 'Failed to complete OAuth flow' });
  }
});

// Check Google Calendar connection status
router.get('/google-status/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hasValidToken = user.googleAccessToken && 
                         user.googleTokenExpiry && 
                         new Date() < new Date(user.googleTokenExpiry);

    res.json({
      connected: !!user.googleAccessToken,
      hasValidToken,
      needsRefresh: user.googleAccessToken && !hasValidToken
    });
  } catch (error) {
    console.error('Error checking Google status:', error);
    res.status(500).json({ error: 'Failed to check Google status' });
  }
});

module.exports = router;
module.exports.authenticateJWT = authenticateJWT; 