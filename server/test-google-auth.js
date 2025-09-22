#!/usr/bin/env node

/**
 * Google Auth Verification Test Script
 * 
 * This script tests the complete Google OAuth and Calendar integration setup.
 * Run this script to verify your Google Auth configuration is working correctly.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { google } = require('googleapis');
const User = require('./models/User');
const { createCalendarEvent, getAuthUrl, getTokensFromCode, refreshAccessToken } = require('./utils/googleCalendar');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  const color = passed ? 'green' : 'red';
  log(`${status} ${testName}`, color);
  if (details) {
    log(`   ${details}`, 'cyan');
  }
}

async function testEnvironmentVariables() {
  logSection('1. Environment Variables Check');
  
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'GOOGLE_REDIRECT_URI',
    'JWT_SECRET',
    'MONGODB_URI'
  ];

  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const present = !!value;
    allPresent = allPresent && present;
    
    if (present) {
      const displayValue = varName.includes('SECRET') || varName.includes('CLIENT_SECRET') 
        ? value.substring(0, 10) + '...' 
        : value;
      logTest(varName, true, `Value: ${displayValue}`);
    } else {
      logTest(varName, false, 'Missing environment variable');
    }
  }

  return allPresent;
}

async function testDatabaseConnection() {
  logSection('2. Database Connection Test');
  
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    logTest('MongoDB Connection', true, 'Successfully connected to database');
    
    // Test User model
    const userCount = await User.countDocuments();
    logTest('User Model', true, `Found ${userCount} users in database`);
    
    return true;
  } catch (error) {
    logTest('Database Connection', false, error.message);
    return false;
  }
}

async function testGoogleOAuthConfiguration() {
  logSection('3. Google OAuth Configuration Test');
  
  try {
    // Test OAuth URL generation
    const authUrl = getAuthUrl();
    if (authUrl) {
      logTest('OAuth URL Generation', true, 'Successfully generated authorization URL');
      log(`   Auth URL: ${authUrl}`, 'cyan');
    } else {
      logTest('OAuth URL Generation', false, 'Failed to generate authorization URL');
      return false;
    }

    // Test OAuth client creation
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    logTest('OAuth Client Creation', true, 'Successfully created OAuth2 client');
    
    return true;
  } catch (error) {
    logTest('Google OAuth Configuration', false, error.message);
    return false;
  }
}

async function testUserAuthentication() {
  logSection('4. User Authentication Test');
  
  try {
    // Find a user with Google tokens
    const user = await User.findOne({ 
      googleAccessToken: { $exists: true, $ne: null } 
    });

    if (!user) {
      logTest('User with Google Tokens', false, 'No users found with Google access tokens');
      log('   To test calendar integration, a user must first authenticate with Google', 'yellow');
      return false;
    }

    logTest('User with Google Tokens', true, `Found user: ${user.email}`);
    logTest('Access Token Present', !!user.googleAccessToken, user.googleAccessToken ? 'Token available' : 'No access token');
    logTest('Refresh Token Present', !!user.googleRefreshToken, user.googleRefreshToken ? 'Refresh token available' : 'No refresh token');
    logTest('Calendar Connected', user.googleCalendarConnected, user.googleCalendarConnected ? 'Calendar integration enabled' : 'Calendar not connected');

    // Check token expiry
    if (user.googleTokenExpiry) {
      const isExpired = new Date() > new Date(user.googleTokenExpiry);
      logTest('Token Expiry Check', !isExpired, isExpired ? 'Token is expired' : 'Token is valid');
    }

    return user;
  } catch (error) {
    logTest('User Authentication', false, error.message);
    return false;
  }
}

async function testCalendarIntegration(user) {
  logSection('5. Google Calendar Integration Test');
  
  if (!user || !user.googleAccessToken) {
    logTest('Calendar Integration', false, 'No user with valid access token found');
    return false;
  }

  try {
    // Test token refresh
    if (user.googleRefreshToken) {
      try {
        const refreshedTokens = await refreshAccessToken(user.googleRefreshToken);
        if (refreshedTokens && refreshedTokens.access_token) {
          logTest('Token Refresh', true, 'Successfully refreshed access token');
        } else {
          logTest('Token Refresh', false, 'Failed to refresh access token');
        }
      } catch (error) {
        logTest('Token Refresh', false, error.message);
      }
    } else {
      logTest('Token Refresh', false, 'No refresh token available');
    }

    // Test calendar event creation
    const testEvent = await createCalendarEvent({
      hostEmail: user.email,
      guestEmail: 'test@example.com',
      start: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      end: new Date(Date.now() + 25 * 60 * 60 * 1000),   // Tomorrow + 1 hour
      summary: 'Google Auth Test Event',
      description: 'This is a test event created by the Google Auth verification script',
      accessToken: user.googleAccessToken,
      refreshToken: user.googleRefreshToken
    });

    if (testEvent.success) {
      logTest('Calendar Event Creation', true, 'Successfully created test event');
      logTest('Meet Link Generation', !!testEvent.meetLink, testEvent.meetLink ? 'Meet link generated' : 'No meet link');
      logTest('Event ID', !!testEvent.eventId, `Event ID: ${testEvent.eventId}`);
      
      if (testEvent.isMock) {
        logTest('Real Calendar Integration', false, 'Using mock calendar (Google Calendar API not fully configured)');
        log('   This means the app will work but with limited calendar functionality', 'yellow');
      } else {
        logTest('Real Calendar Integration', true, 'Full Google Calendar integration working');
      }
    } else {
      logTest('Calendar Event Creation', false, testEvent.error || 'Unknown error');
    }

    return testEvent.success;
  } catch (error) {
    logTest('Calendar Integration', false, error.message);
    return false;
  }
}

async function generateRecommendations(results) {
  logSection('6. Recommendations');
  
  const recommendations = [];

  if (!results.environment) {
    recommendations.push('Set up all required environment variables (see .env.example)');
  }

  if (!results.database) {
    recommendations.push('Check MongoDB connection and ensure database is running');
  }

  if (!results.oauth) {
    recommendations.push('Configure Google OAuth credentials in Google Cloud Console');
    recommendations.push('Enable Google Calendar API in your Google Cloud project');
  }

  if (!results.user) {
    recommendations.push('Have a user authenticate with Google to test calendar integration');
  }

  if (!results.calendar) {
    recommendations.push('Check Google Calendar API permissions and scopes');
    recommendations.push('Verify OAuth consent screen includes calendar scopes');
  }

  if (recommendations.length === 0) {
    log('🎉 All tests passed! Your Google Auth is fully configured and working.', 'green');
  } else {
    log('📋 Action items to complete Google Auth setup:', 'yellow');
    recommendations.forEach((rec, index) => {
      log(`   ${index + 1}. ${rec}`, 'cyan');
    });
  }
}

async function main() {
  log('🔍 Google Auth Verification Test', 'bright');
  log('Starting comprehensive Google OAuth and Calendar integration test...', 'blue');

  const results = {};

  // Run all tests
  results.environment = await testEnvironmentVariables();
  results.database = await testDatabaseConnection();
  results.oauth = await testGoogleOAuthConfiguration();
  const user = await testUserAuthentication();
  results.user = !!user;
  results.calendar = await testCalendarIntegration(user);

  // Generate recommendations
  await generateRecommendations(results);

  // Summary
  logSection('Test Summary');
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  log(`Tests Passed: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'yellow');
  
  if (passedTests === totalTests) {
    log('🎉 Google Auth is fully verified and ready to use!', 'green');
  } else {
    log('⚠️  Some tests failed. Check the recommendations above.', 'yellow');
  }

  // Cleanup
  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
    log('Database connection closed', 'blue');
  }

  process.exit(passedTests === totalTests ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log(`Unhandled rejection: ${error.message}`, 'red');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'red');
  process.exit(1);
});

// Run the test
if (require.main === module) {
  main();
}

module.exports = { main };
