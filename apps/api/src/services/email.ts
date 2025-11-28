import Pop3Command from 'node-pop3';
import { simpleParser } from 'mailparser';

export interface EmailMessage {
  uidl: string;
  subject: string;
  text: string;
  html?: string;
  date: Date;
  from: string;
}

export class EmailService {
  private client: Pop3Command;

  constructor(config: { host: string; port: number; user: string; password: string; tls?: boolean }) {
    this.client = new Pop3Command({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      tls: config.tls ?? true,
    });
  }

  async fetchEmails(limit: number = 10): Promise<EmailMessage[]> {
    try {
      // List messages with UIDL
      const list = await this.client.UIDL();
      if (!list || list.length === 0) {
        return [];
      }

      // Get the last 'limit' messages
      const messagesToFetch = list.slice(-limit);
      const emails: EmailMessage[] = [];

      for (const msg of messagesToFetch) {
        const msgNumber = msg[0];
        const uidl = msg[1];

        const raw = await this.client.RETR(msgNumber);
        const parsed = await simpleParser(raw);

        emails.push({
          uidl: uidl,
          subject: parsed.subject || '(No Subject)',
          text: parsed.text || '',
          html: parsed.html || undefined,
          date: parsed.date || new Date(),
          from: parsed.from?.text || 'Unknown',
        });
      }

      await this.client.QUIT();
      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }
}
