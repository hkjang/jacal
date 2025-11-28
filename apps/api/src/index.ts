import './types/express';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import taskRoutes from './routes/tasks';
import eventRoutes from './routes/events';
import authRoutes from './routes/auth';
import nluRoutes from './routes/nlu';
import settingsRoutes from './routes/settings';
import calendarRoutes from './routes/calendar';
import focusRoutes from './routes/focus';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';
import cron from 'node-cron';
import { notificationService } from './services/notification';
import { autoRegisterService } from './services/auto-register';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Jacal API - Productivity Platform' });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/nlu', nluRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`🚀 Server is running on port ${port}`);

  // Schedule reminder check every minute
  cron.schedule('* * * * *', () => {
    notificationService.checkReminders();
  });

  // Schedule email check every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    autoRegisterService.processNewEmails();
  });
});
