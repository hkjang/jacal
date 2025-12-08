import nodemailer from 'nodemailer';
import prisma from '../lib/prisma';

export class NotificationService {
  private transporter;

  constructor() {
    // Use Ethereal for dev if no SMTP config
    if (!process.env.SMTP_HOST) {
      console.log('No SMTP config found, using Ethereal for development');
      this.createTestAccount();
    } else {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  private async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Ethereal mail transporter ready');
      console.log('Preview URL: https://ethereal.email/messages');
    } catch (err) {
      console.error('Failed to create test account', err);
    }
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (!this.transporter) {
      console.log('Transporter not ready, skipping email');
      return;
    }

    try {
      const info = await this.transporter.sendMail({
        from: '"Jacal" <noreply@jacal.app>',
        to,
        subject,
        html,
      });

      console.log('Message sent: %s', info.messageId);
      if (nodemailer.getTestMessageUrl(info)) {
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  // Trigger all active notification webhooks for a reminder
  private async triggerNotificationWebhooks(
    reminder: { id: string; entityType: string; entityId: string; notifyAt: Date },
    entityTitle: string,
    userName: string,
    userEmail: string
  ) {
    try {
      // Get all active notification webhooks
      const webhooks = await prisma.notificationWebhook.findMany({
        where: { active: true },
      });

      if (webhooks.length === 0) {
        console.log('No active notification webhooks configured');
        return;
      }

      console.log(`Triggering ${webhooks.length} notification webhook(s) for reminder ${reminder.id}`);

      const fetch = (await import('node-fetch')).default;

      for (const webhook of webhooks) {
        // Create log entry as pending
        const log = await prisma.notificationWebhookLog.create({
          data: {
            webhookId: webhook.id,
            reminderId: reminder.id,
            status: 'pending',
          },
        });

        try {
          const payload = {
            type: 'reminder',
            timestamp: new Date().toISOString(),
            data: {
              reminderId: reminder.id,
              entityType: reminder.entityType,
              entityId: reminder.entityId,
              entityTitle,
              userName,
              userEmail,
              notifyAt: reminder.notifyAt.toISOString(),
            },
          };

          const headers: Record<string, string> = {
            'Content-Type': 'application/json',
          };

          // Add custom headers if configured
          if (webhook.headers && typeof webhook.headers === 'object') {
            Object.assign(headers, webhook.headers);
          }

          const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
          });

          const responseText = await response.text();

          // Update log with result
          await prisma.notificationWebhookLog.update({
            where: { id: log.id },
            data: {
              status: response.ok ? 'success' : 'failed',
              statusCode: response.status,
              response: response.ok ? null : responseText.substring(0, 1000),
              sentAt: new Date(),
            },
          });

          if (response.ok) {
            console.log(`Webhook ${webhook.name} sent successfully for reminder ${reminder.id}`);
          } else {
            console.error(`Webhook ${webhook.name} failed: ${response.status}`);
          }
        } catch (fetchError: any) {
          // Update log with error
          await prisma.notificationWebhookLog.update({
            where: { id: log.id },
            data: {
              status: 'failed',
              response: fetchError.message,
              sentAt: new Date(),
            },
          });
          console.error(`Webhook ${webhook.name} error:`, fetchError.message);
        }
      }
    } catch (error) {
      console.error('Error triggering notification webhooks:', error);
    }
  }

  async checkReminders() {
    console.log('Checking for due reminders...');
    try {
      const now = new Date();

      // Find unsent reminders due now or in the past
      const reminders = await prisma.reminder.findMany({
        where: {
          sent: false,
          notifyAt: {
            lte: now,
          },
        },
      });

      console.log(`Found ${reminders.length} due reminders`);

      for (const reminder of reminders) {
        let user;
        let title;
        let type;

        // Manually fetch task or event based on entityType
        if (reminder.entityType === 'task') {
          const task = await prisma.task.findUnique({
            where: { id: reminder.entityId },
            include: { user: true },
          });

          if (task) {
            user = task.user;
            title = task.title;
            type = 'Task';
          }
        } else if (reminder.entityType === 'event') {
          const event = await prisma.event.findUnique({
            where: { id: reminder.entityId },
            include: { user: true },
          });

          if (event) {
            user = event.user;
            title = event.title;
            type = 'Event';
          }
        }

        if (user && user.email) {
          // Send email notification
          await this.sendEmail(
            user.email,
            `Reminder: ${title}`,
            `<p>This is a reminder for your ${type}: <strong>${title}</strong></p>`
          );

          // Trigger notification webhooks
          await this.triggerNotificationWebhooks(
            reminder,
            title || 'Unknown',
            user.name || user.email,
            user.email
          );

          // Mark as sent
          await prisma.reminder.update({
            where: { id: reminder.id },
            data: { sent: true },
          });
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error);
    }
  }
}

export const notificationService = new NotificationService();
