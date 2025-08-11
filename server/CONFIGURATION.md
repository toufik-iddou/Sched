# Configuration Guide

## Email Setup (Gmail)

To fix the email sending issue, you need to configure Gmail properly:

### 1. Enable 2-Step Verification
- Go to your Google Account settings
- Navigate to Security > 2-Step Verification
- Enable it if not already enabled

### 2. Generate App Password
- Go to Google Account > Security > 2-Step Verification
- Click on "App passwords" at the bottom
- Select "Mail" and "Other (Custom name)"
- Name it "Codtoop Calendar"
- Copy the generated 16-character password

### 3. Set Environment Variables
Create a `.env` file in the server directory with:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
```

## Google Calendar Setup

To fix the calendar scheduling and meet link issues:

### 1. Create Google Cloud Project
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing one
- Enable the Google Calendar API

### 2. Create OAuth 2.0 Credentials
- Go to APIs & Services > Credentials
- Click "Create Credentials" > "OAuth 2.0 Client IDs"
- Choose "Web application"
- Add authorized redirect URIs:
  - `http://localhost:5000/auth/google/callback` (for development)
  - `https://yourdomain.com/auth/google/callback` (for production)

### 3. Set Environment Variables
Add to your `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
```

## Testing the Configuration

Use the test endpoint to verify your setup:

```bash
curl -X POST http://localhost:5000/booking/test \
  -H "Content-Type: application/json" \
  -d '{"testEmail": true, "testCalendar": true}'
```

## Troubleshooting

### Email Issues
- Check that EMAIL_USER and EMAIL_PASS are set correctly
- Verify you're using an App Password, not your regular Gmail password
- Check Gmail's "Less secure app access" is not needed (use App Password instead)

### Calendar Issues
- Verify Google Calendar API is enabled in your Google Cloud project
- Check that OAuth credentials are correct
- Ensure redirect URI matches exactly

### Common Error Messages
- "Email configuration missing": Set EMAIL_USER and EMAIL_PASS
- "Google Calendar not configured": Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI
- "Invalid credentials": Check your App Password or OAuth credentials


