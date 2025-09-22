# 🔍 Google Auth Verification Guide

This guide will help you verify that Google OAuth and Calendar integration is properly configured and working in your Codtoop Calendar application.

## 🚀 Quick Start Verification

### 1. Run the Automated Test Script

The easiest way to verify your Google Auth setup is to run the automated test script:

```bash
cd server
npm run test-google-auth
```

This script will:
- ✅ Check all environment variables
- ✅ Test database connection
- ✅ Verify Google OAuth configuration
- ✅ Test user authentication
- ✅ Validate calendar integration
- 📋 Provide specific recommendations for any issues

### 2. Use the API Verification Endpoint

You can also verify Google Auth via the API endpoint:

```bash
# Basic health check
curl http://localhost:5000/auth/health

# Comprehensive verification (replace USER_ID with actual user ID)
curl http://localhost:5000/auth/verify-google-auth?userId=USER_ID
```

## 🔧 Manual Verification Steps

### Step 1: Environment Variables Check

Ensure these variables are set in your `.env` file:

```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret

# Database
MONGODB_URI=mongodb://localhost:27017/codtoop_calendar

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### Step 2: Google Cloud Console Setup

1. **Create/Select Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one

2. **Enable APIs**
   - Go to "APIs & Services" > "Library"
   - Search for and enable:
     - Google Calendar API
     - Google+ API (if not already enabled)

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:5000/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)

4. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" > "OAuth consent screen"
   - Add required scopes:
     - `.../auth/userinfo.profile`
     - `.../auth/userinfo.email`
     - `.../auth/calendar`
     - `.../auth/calendar.events`

### Step 3: Test User Authentication

1. **Start your server**
   ```bash
   cd server
   npm run dev
   ```

2. **Test OAuth flow**
   - Visit `http://localhost:3000/login`
   - Click "Sign in with Google"
   - Complete the OAuth flow
   - Verify you're redirected to dashboard

3. **Check user in database**
   ```bash
   # Connect to MongoDB and check users collection
   mongo
   use codtoop_calendar
   db.users.find({}, {email: 1, googleId: 1, googleAccessToken: 1})
   ```

### Step 4: Test Calendar Integration

1. **Create a test booking**
   - Go to your booking page
   - Create a test meeting
   - Check if Google Calendar event is created
   - Verify Google Meet link is generated

2. **Check calendar events**
   - Visit your Google Calendar
   - Look for the test event
   - Verify it has a working Meet link

## 🧪 Testing Commands

### Test Environment Variables
```bash
cd server
node -e "
const required = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_REDIRECT_URI', 'JWT_SECRET'];
required.forEach(var => {
  console.log(\`\${var}: \${process.env[var] ? '✅ Set' : '❌ Missing'}\`);
});
"
```

### Test OAuth URL Generation
```bash
curl http://localhost:5000/user/google-auth-url
```

### Test User Google Status
```bash
# Replace USER_ID with actual user ID
curl http://localhost:5000/user/google-status/USER_ID
```

### Test Calendar Event Creation
```bash
curl -X POST http://localhost:5000/booking/test \
  -H "Content-Type: application/json" \
  -d '{"testCalendar": true, "userId": "USER_ID"}'
```

## 🔍 Verification Checklist

### Environment Setup
- [ ] All required environment variables are set
- [ ] Google Cloud project is created
- [ ] Google Calendar API is enabled
- [ ] OAuth 2.0 credentials are configured
- [ ] Redirect URIs are correctly set

### OAuth Configuration
- [ ] OAuth consent screen includes required scopes
- [ ] Client ID and secret are valid
- [ ] Redirect URI matches exactly
- [ ] JWT secret is set and secure

### User Authentication
- [ ] User can sign in with Google
- [ ] User data is saved to database
- [ ] Access and refresh tokens are stored
- [ ] Token expiry is set correctly

### Calendar Integration
- [ ] Calendar events are created successfully
- [ ] Google Meet links are generated
- [ ] Event invitations are sent
- [ ] Token refresh works correctly

## 🚨 Common Issues and Solutions

### Issue: "Google OAuth not configured"
**Solution:**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set
- Verify credentials in Google Cloud Console
- Ensure redirect URI matches exactly

### Issue: "Calendar API not enabled"
**Solution:**
- Go to Google Cloud Console > APIs & Services > Library
- Search for "Google Calendar API"
- Click "Enable"

### Issue: "Invalid redirect URI"
**Solution:**
- Check that redirect URI in `.env` matches exactly
- Verify URI is added to OAuth 2.0 credentials
- Ensure no trailing slashes or typos

### Issue: "Token expired"
**Solution:**
- User needs to re-authenticate with Google
- Check if refresh token is working
- Verify token expiry logic

### Issue: "Calendar events not created"
**Solution:**
- Check if user has valid access token
- Verify calendar scopes are included
- Test with the verification script

## 📊 Verification Results

### All Tests Pass ✅
Your Google Auth is fully configured and working correctly!

### Some Tests Fail ⚠️
Check the specific error messages and follow the recommendations provided by the test script.

### No Tests Pass ❌
Start with the environment variables and work through each step systematically.

## 🔄 Continuous Verification

### Automated Testing
Add the verification script to your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Test Google Auth
  run: |
    cd server
    npm run test-google-auth
```

### Monitoring
Set up monitoring for:
- OAuth callback success rates
- Calendar event creation success
- Token refresh failures
- API error rates

## 📞 Support

If you encounter issues:

1. **Run the verification script** first
2. **Check the logs** for specific error messages
3. **Verify Google Cloud Console** settings
4. **Test with a fresh user** authentication
5. **Check the troubleshooting section** in this guide

The verification tools will help you identify and resolve any Google Auth issues quickly and efficiently.
