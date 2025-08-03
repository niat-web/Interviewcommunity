// server/services/google.service.js
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const { logEvent, logError } = require('../middleware/logger.middleware');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CREDENTIALS_PATH = path.join(__dirname, '../config/credentials.json');
const TOKEN_PATH = path.join(__dirname, '../config/token.json');
const TIMEZONE = "Asia/Kolkata";

let authClient = null;

async function getAuthClient() {
    // Return the cached client if it already exists
    if (authClient) return authClient;

    try {
        const credentialsContent = await fs.readFile(CREDENTIALS_PATH);
        const credentials = JSON.parse(credentialsContent);
        const { client_secret, client_id, redirect_uris } = credentials.installed;
        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        try {
            const tokenContent = await fs.readFile(TOKEN_PATH);
            oAuth2Client.setCredentials(JSON.parse(tokenContent));
        } catch (err) {
            logError('google_token_error', err, { message: 'token.json not found or invalid.' });
            console.error('Error loading token.json. Please generate a new one.');
            throw new Error('Google API token is missing or invalid.');
        }

        // *** SIMPLIFIED TOKEN REFRESH HANDLER ***
        // The google-auth-library handles token refreshing in memory.
        // We will just log the event without writing to the file to avoid potential crashes.
        oAuth2Client.on('tokens', (tokens) => {
            logEvent('google_token_refresh_event_triggered');
            if (tokens.access_token) {
                 logEvent('google_access_token_refreshed_in_memory');
            }
        });

        authClient = oAuth2Client;
        return authClient;

    } catch (error) {
        logError('google_auth_error', error);
        console.error('Error during Google authentication setup:', error.message);
        throw new Error('Failed to configure Google API authentication.');
    }
}

// --- ADDITION START ---
async function fetchRecentCalendarEvents() {
    try {
        const oAuth2Client = await getAuthClient();
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        
        // Fetch events from the last 7 days.
        const timeMin = new Date();
        timeMin.setDate(timeMin.getDate() - 7);

        const res = await calendar.events.list({
            calendarId: 'primary',
            timeMin: timeMin.toISOString(),
            maxResults: 250, // Max results per page
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = res.data.items;
        logEvent('google_calendar_events_fetched', { count: events.length });
        return events;

    } catch (error) {
        logError('google_calendar_fetch_error', error);
        console.error('Error fetching Google Calendar events:', error.message);
        throw new Error('Could not fetch Google Calendar events.');
    }
}
// --- ADDITION END ---

const createCalendarEvent = async ({ summary, description, start, end, attendees }) => {
    try {
        const oAuth2Client = await getAuthClient();
        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        
        const validAttendees = attendees
            .filter(email => email && typeof email === 'string' && email.includes('@'))
            .map(email => ({ email }));

        const event = {
            summary,
            description,
            start: { ...start, timeZone: TIMEZONE },
            end: { ...end, timeZone: TIMEZONE },
            attendees: validAttendees,
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' }
                }
            },
        };
        
        const res = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1,
        });

        logEvent('google_calendar_event_created', { eventId: res.data.id, summary });
        return res.data;

    } catch (error) {
        logError('google_calendar_creation_error', error, { summary });
        console.error('Error creating Google Calendar event:', error.message);
        throw new Error('Could not create Google Calendar event.');
    }
};

module.exports = { createCalendarEvent, fetchRecentCalendarEvents };
