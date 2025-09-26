const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const express = require('express');
const jwt = require('jsonwebtoken');

// Initialize State Generator utility for OAuth
const crypto = require('crypto');

const router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_REDIRECT_URI,
  session: false
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
router.get('/google', (req, res, next) => {
  // Build custom authorization URL with proper parameters for refresh token
  const scope = [
    'profile', 
    'email',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    scope: scope.join(' '),
    response_type: 'code',
    access_type: 'offline',    // Critical for getting refresh tokens  
    prompt: 'consent'          // Critical for forcing consent screen
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.redirect(authUrl);
});

router.get('/google/callback', async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=access_denied`);
  }
  
  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);
  }
  
  try {
    // Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
      })
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      console.error('Token exchange error:', tokens);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=token_error`);
    }
    
    // Get user profile
    const profileResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokens.access_token}`);
    const profile = await profileResponse.json();
    
    // Create or update user with tokens
    let user = await User.findOne({ googleId: profile.id });
    if (!user) {
      user = await User.create({
        googleId: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        googleAccessToken: tokens.access_token,
        googleRefreshToken: tokens.refresh_token || null, // Handle undefined gracefully
        googleTokenExpiry: new Date(Date.now() + tokens.expires_in * 1000),
        googleCalendarConnected: true,
      });
    } else {
      user.googleAccessToken = tokens.access_token;
      if (tokens.refresh_token) {
        user.googleRefreshToken = tokens.refresh_token;
      }
      user.googleTokenExpiry = new Date(Date.now() + tokens.expires_in * 1000);
      user.googleCalendarConnected = true;
      await user.save();
    }
    
    console.log('Tokens received:', { accessToken: tokens.access_token, refreshToken: tokens.refresh_token });
    
    // Issue JWT
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/login?token=${jwtToken}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_error`);
  }
});

module.exports = router; 