import prisma from '../lib/prisma';
import { EmailService } from './email';
import { parseEmailContent } from './nlu';
import pLimit from 'p-limit';

export class AutoRegisterService {
  private limit = pLimit(5); // Process 5 users concurrently

  async processNewEmails() {
    console.log('Starting email check...');
    
    // 1. Fetch users with POP3 enabled
    const users = await prisma.userSettings.findMany({
      where: {
        pop3Enabled: true,
        pop3Host: { not: null },
        pop3User: { not: null },
        pop3Password: { not: null },
      },
      include: {
        user: true,
      },
    });

    console.log(`Found ${users.length} users with POP3 enabled.`);

    // 2. Process users with concurrency limit
    const promises = users.map((settings) => {
      return this.limit(async () => {
        try {
          await this.processUserEmails(settings);
        } catch (error) {
          console.error(`Error processing emails for user ${settings.userId}:`, error);
        }
      });
    });

    await Promise.all(promises);
    console.log('Email check completed.');
  }
  async processUserEmails(settings: any) {
    if (!settings.pop3Host || !settings.pop3User || !settings.pop3Password) return;

    const emailService = new EmailService({
      host: settings.pop3Host,
      port: settings.pop3Port || 995,
      user: settings.pop3User,
      password: settings.pop3Password,
      tls: settings.pop3Tls ?? true,
    });

    // Fetch last 10 emails to ensure we catch everything
    const emails = await emailService.fetchEmails(10);
    console.log(`Fetched ${emails.length} emails for user ${settings.userId}`);

    for (const email of emails) {
      // Check if email already processed
      const existing = await prisma.processedEmail.findUnique({
        where: {
          userId_uidl: {
            userId: settings.userId,
            uidl: email.uidl,
          },
        },
      });

      if (existing) {
        console.log(`Skipping already processed email: ${email.subject} (${email.uidl})`);
        continue;
      }

      // Parse email content
      const entities = await parseEmailContent(
        email.subject,
        email.text,
        settings.userId,
        settings.user.timezone
      );

      if (entities.length > 0) {
        console.log(`Found ${entities.length} entities in email "${email.subject}"`);
        
        for (const entity of entities) {
          if (entity.type === 'event') {
            await prisma.event.create({
              data: {
                userId: settings.userId,
                title: entity.title,
                description: entity.description || `Imported from email: ${email.subject}`,
                startAt: new Date(entity.startAt!),
                endAt: new Date(entity.endAt!),
                location: entity.location,
                sourceCalendar: 'email-import',
              },
            });
          } else if (entity.type === 'task') {
            await prisma.task.create({
              data: {
                userId: settings.userId,
                title: entity.title,
                description: entity.description || `Imported from email: ${email.subject}`,
                dueAt: entity.dueAt ? new Date(entity.dueAt) : undefined,
                status: 'pending',
              },
            });
          }
        }
      }

      // Mark as processed
      await prisma.processedEmail.create({
        data: {
          userId: settings.userId,
          uidl: email.uidl,
        },
      });
    }
  }
}

export const autoRegisterService = new AutoRegisterService();
