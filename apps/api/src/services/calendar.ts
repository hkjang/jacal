import { google } from 'googleapis';
import prisma from '../lib/prisma';

export class CalendarService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google/callback'
    );
  }

  async syncGoogleCalendar(userId: string) {
    try {
      // Get tokens
      const connectedAccount = await prisma.connectedAccount.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: 'google',
          },
        },
      });

      if (!connectedAccount) {
        throw new Error('Google Calendar not connected');
      }

      // Set credentials
      this.oauth2Client.setCredentials({
        access_token: connectedAccount.accessToken,
        refresh_token: connectedAccount.refreshToken || undefined,
        expiry_date: connectedAccount.expiresAt ? connectedAccount.expiresAt.getTime() : undefined,
      });

      // Refresh token if needed (handled by googleapis automatically if refresh_token is present)
      // But we might need to listen to 'tokens' event to update DB, or check expiry manually.
      // For simplicity, we rely on auto-refresh and update DB if new tokens are returned in a future improvement.
      
      const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

      // List events from primary calendar
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items;
      if (!events) return;

      console.log(`Found ${events.length} events from Google Calendar`);

      // Upsert events to DB
      for (const event of events) {
        if (!event.start?.dateTime || !event.end?.dateTime) continue; // Skip all-day events for now

        const existingEvent = await prisma.event.findFirst({
          where: {
            userId,
            externalId: event.id,
            sourceCalendar: 'google',
          },
        });

        const eventData = {
          title: event.summary || 'No Title',
          description: event.description,
          startAt: new Date(event.start.dateTime),
          endAt: new Date(event.end.dateTime),
          location: event.location,
        };

        if (existingEvent) {
          await prisma.event.update({
            where: { id: existingEvent.id },
            data: eventData,
          });
        } else {
          await prisma.event.create({
            data: {
              userId,
              ...eventData,
              sourceCalendar: 'google',
              externalId: event.id,
            },
          });
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  }
}

export const calendarService = new CalendarService();
