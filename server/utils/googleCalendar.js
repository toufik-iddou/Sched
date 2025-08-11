// This is a placeholder for Google Calendar integration.
// In production, use OAuth2 or a service account with domain-wide delegation.
const { google } = require('googleapis');

// Google Calendar API configuration
const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

// Create OAuth2 client
const createOAuth2Client = () => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REDIRECT_URI) {
    console.error('Google Calendar configuration missing. Required environment variables:');
    console.error('- GOOGLE_CLIENT_ID');
    console.error('- GOOGLE_CLIENT_SECRET');
    console.error('- GOOGLE_REDIRECT_URI');
    return null;
  }

  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
};

// Get authorization URL for OAuth2 flow
function getAuthUrl() {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) return null;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
}

// Exchange authorization code for tokens
async function getTokensFromCode(code) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) return null;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error getting tokens:', error);
    return null;
  }
}

// Create calendar event with Google Meet
async function createCalendarEvent({ hostEmail, guestEmail, start, end, summary, description = '', accessToken }) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) {
    console.error('OAuth2 client not available');
    return { success: false, error: 'Google Calendar not configured' };
  }

  if (!accessToken) {
    console.error('Access token required for calendar operations');
    return { success: false, error: 'Access token required' };
  }

  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    
    const event = {
      summary: summary,
      description: description,
      start: {
        dateTime: new Date(start).toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(end).toISOString(),
        timeZone: 'UTC',
      },
      attendees: [
        { email: hostEmail },
        { email: guestEmail }
      ],
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: {
            type: 'hangoutsMeet'
          }
        }
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 10 } // 10 minutes before
        ]
      }
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      conferenceDataVersion: 1,
      sendUpdates: 'all'
    });

    const createdEvent = response.data;
    const meetLink = createdEvent.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;

    console.log('Calendar event created successfully:', createdEvent.id);
    
    return {
      success: true,
      eventId: createdEvent.id,
      meetLink: meetLink || 'https://meet.google.com/',
      eventUrl: createdEvent.htmlLink
    };

  } catch (error) {
    console.error('Error creating calendar event:', error);
    return { 
      success: false, 
      error: error.message,
      // Fallback: return a mock meet link if calendar creation fails
      meetLink: 'https://meet.google.com/fallback-link'
    };
  }
}

// Update calendar event
async function updateCalendarEvent({ eventId, updates, accessToken }) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) return { success: false, error: 'Google Calendar not configured' };

  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.patch({
      calendarId: 'primary',
      eventId: eventId,
      resource: updates,
      sendUpdates: 'all'
    });

    return { success: true, event: response.data };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    return { success: false, error: error.message };
  }
}

// Delete calendar event
async function deleteCalendarEvent({ eventId, accessToken }) {
  const oauth2Client = createOAuth2Client();
  if (!oauth2Client) return { success: false, error: 'Google Calendar not configured' };

  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
      sendUpdates: 'all'
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    return { success: false, error: error.message };
  }
}

// Fallback function for when Google Calendar is not configured
async function createMockCalendarEvent({ hostEmail, guestEmail, start, end, summary }) {
  console.log('Using mock calendar event (Google Calendar not configured)');
  
  // Generate a mock meet link
  const mockMeetId = Math.random().toString(36).substring(2, 15);
  const mockMeetLink = `https://meet.google.com/${mockMeetId}`;
  
  return {
    success: true,
    eventId: `mock-event-${Date.now()}`,
    meetLink: mockMeetLink,
    eventUrl: mockMeetLink,
    isMock: true
  };
}

module.exports = { 
  createCalendarEvent, 
  updateCalendarEvent, 
  deleteCalendarEvent,
  getAuthUrl,
  getTokensFromCode,
  createMockCalendarEvent
}; 