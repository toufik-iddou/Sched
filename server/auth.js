const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI,
  session: false,
  accessType: 'offline',
  prompt: 'consent'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.emails[0].value,
        name: profile.displayName,
        avatar: profile.photos[0].value,
        googleAccessToken: accessToken,
        googleRefreshToken: refreshToken || null, // Handle undefined gracefully
        googleTokenExpiry: new Date(Date.now() + 3600 * 1000),
        googleCalendarConnected: true,
      });
    } else {
      // Only update tokens if refreshToken is provided
      user.googleAccessToken = accessToken;
      if (refreshToken) {
        user.googleRefreshToken = refreshToken;
      }
      user.googleTokenExpiry = new Date(Date.now() + 3600 * 1000);
      user.googleCalendarConnected = true;
      await user.save();
    }
    return done(null, user);
  } catch (err) {
    console.error('OAuth callback error:', err);
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: [
    'profile', 
    'email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ],
  accessType: 'offline',
  prompt: 'consent'
}));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: `${process.env.FRONTEND_URL}/login?error=oauth_error` }),
  async (req, res) => {
    try {
      // User is available in req.user after successful passport authentication
      const user = req.user;
      
      console.log('User authenticated:', { userId: user._id, email: user.email });
      
      // Issue JWT
      const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      
      // Redirect to frontend with token
      res.redirect(`${process.env.FRONTEND_URL}/login?token=${jwtToken}`);
    } catch (error) {
      console.error('JWT generation error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=jwt_error`);
    }
  }
);

module.exports = router; 