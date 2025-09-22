const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createCalendarEvent, refreshAccessToken } = require('../utils/googleCalendar');

const router = express.Router();

// Note: Google OAuth routes are now handled in ../auth.js
// This file contains only verification and health check endpoints

// Comprehensive Google Auth verification endpoint
router.get('/verify-google-auth', async (req, res) => {
  try {
    const results = {
      environment: {},
      oauth: {},
      calendar: {},
      user: {},
      recommendations: []
    };

    // 1. Check Environment Variables
    results.environment = {
      hasClientId: !!process.env.GOOGLE_CLIENT_ID,
      hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      hasRedirectUri: !!process.env.GOOGLE_REDIRECT_URI,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV,
      frontendUrl: process.env.FRONTEND_URL
    };

    // 2. Validate OAuth Configuration
    if (!results.environment.hasClientId || !results.environment.hasClientSecret) {
      results.oauth.status = 'INCOMPLETE';
      results.oauth.error = 'Missing Google OAuth credentials';
      results.recommendations.push('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in environment variables');
    } else {
      results.oauth.status = 'CONFIGURED';
      results.oauth.clientId = process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...';
      results.oauth.redirectUri = process.env.GOOGLE_REDIRECT_URI;
    }

    // 3. Test OAuth URL Generation
    try {
      const { getAuthUrl } = require('../utils/googleCalendar');
      const authUrl = getAuthUrl();
      if (authUrl) {
        results.oauth.authUrlGenerated = true;
        results.oauth.authUrl = authUrl;
      } else {
        results.oauth.authUrlGenerated = false;
        results.oauth.error = 'Failed to generate OAuth URL';
      }
    } catch (error) {
      results.oauth.authUrlGenerated = false;
      results.oauth.error = error.message;
    }

    // 4. Check if user is authenticated (if userId provided)
    const userId = req.query.userId;
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          results.user = {
            found: true,
            hasGoogleId: !!user.googleId,
            hasAccessToken: !!user.googleAccessToken,
            hasRefreshToken: !!user.googleRefreshToken,
            googleCalendarConnected: user.googleCalendarConnected,
            tokenExpiry: user.googleTokenExpiry,
            isTokenExpired: user.googleTokenExpiry ? new Date() > new Date(user.googleTokenExpiry) : null
          };

          // 5. Test Calendar Integration (if user has tokens)
          if (user.googleAccessToken) {
            try {
              // Test token refresh
              if (user.googleRefreshToken) {
                const refreshedTokens = await refreshAccessToken(user.googleRefreshToken);
                results.calendar.tokenRefresh = {
                  success: !!refreshedTokens,
                  hasNewAccessToken: !!refreshedTokens?.access_token
                };
              }

              // Test calendar event creation (mock)
              const testEvent = await createCalendarEvent({
                hostEmail: user.email,
                guestEmail: 'test@example.com',
                start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
                end: new Date(Date.now() + 25 * 60 * 60 * 1000),   // Tomorrow + 1 hour
                summary: 'Google Auth Verification Test',
                description: 'This is a test event to verify Google Calendar integration',
                accessToken: user.googleAccessToken,
                refreshToken: user.googleRefreshToken
              });

              results.calendar.eventCreation = {
                success: testEvent.success,
                hasMeetLink: !!testEvent.meetLink,
                meetLink: testEvent.meetLink,
                eventId: testEvent.eventId,
                isMock: testEvent.isMock || false
              };

              if (testEvent.success && !testEvent.isMock) {
                results.calendar.status = 'FULLY_FUNCTIONAL';
              } else if (testEvent.success && testEvent.isMock) {
                results.calendar.status = 'FALLBACK_MODE';
                results.recommendations.push('Calendar integration is in fallback mode. Check Google Calendar API configuration.');
              } else {
                results.calendar.status = 'ERROR';
                results.calendar.error = testEvent.error;
              }
            } catch (error) {
              results.calendar.status = 'ERROR';
              results.calendar.error = error.message;
            }
          } else {
            results.calendar.status = 'NO_TOKENS';
            results.recommendations.push('User needs to authenticate with Google to enable calendar integration');
          }
        } else {
          results.user.found = false;
          results.recommendations.push('User not found. Provide a valid userId to test calendar integration.');
        }
      } catch (error) {
        results.user.error = error.message;
      }
    } else {
      results.user.status = 'NO_USER_ID';
      results.recommendations.push('Add ?userId=USER_ID to test user-specific Google Auth functionality');
    }

    // 6. Overall Status Assessment
    const hasOAuthConfig = results.environment.hasClientId && results.environment.hasClientSecret;
    const hasUserTokens = results.user.hasAccessToken;
    const hasCalendarAccess = results.calendar.status === 'FULLY_FUNCTIONAL';

    if (hasOAuthConfig && hasUserTokens && hasCalendarAccess) {
      results.overallStatus = 'FULLY_VERIFIED';
      results.summary = 'Google Auth is fully configured and working correctly';
    } else if (hasOAuthConfig && hasUserTokens) {
      results.overallStatus = 'PARTIALLY_VERIFIED';
      results.summary = 'OAuth configured and user authenticated, but calendar integration needs attention';
    } else if (hasOAuthConfig) {
      results.overallStatus = 'BASIC_CONFIG';
      results.summary = 'OAuth configured but user needs to authenticate';
    } else {
      results.overallStatus = 'NOT_CONFIGURED';
      results.summary = 'Google OAuth is not properly configured';
    }

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...results
    });

  } catch (error) {
    console.error('Google Auth verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Quick health check endpoint
router.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      hasGoogleConfig: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV
    }
  };

  if (!health.environment.hasGoogleConfig) {
    health.status = 'WARNING';
    health.message = 'Google OAuth not configured';
  }

  res.json(health);
});

module.exports = router;
