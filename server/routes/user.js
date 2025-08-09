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

module.exports = router;
module.exports.authenticateJWT = authenticateJWT; 