// This is a placeholder for Google Calendar integration.
// In production, use OAuth2 or a service account with domain-wide delegation.
const { google } = require('googleapis');

async function createCalendarEvent({ hostEmail, guestEmail, start, end, summary }) {
  // TODO: Implement real Google Calendar API call
  // Return mock event and meet link for now
  return {
    eventId: 'mock-event-id',
    meetLink: 'https://meet.google.com/mock-link'
  };
}

module.exports = { createCalendarEvent }; 