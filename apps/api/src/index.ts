import './types/express';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
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
import habitRoutes from './routes/habits';
import teamRoutes from './routes/teams';
import searchRoutes from './routes/search';
import publicRoutes from './routes/public';
import cron from 'node-cron';
import { notificationService } from './services/notification';
import { autoRegisterService } from './services/auto-register';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// CORS 설정 (개발 및 프로덕션 환경 지원)
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];



// index.html 서빙 헬퍼 함수 (런타임 환경변수 주입)
const serveIndexHtml = (req: express.Request, res: express.Response) => {
  const publicPath = path.join(__dirname, '..', '..', '..', 'public');
  const indexPath = path.join(publicPath, 'index.html');

  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading index.html:', err);
      return res.status(500).send('Error loading application');
    }

    const apiUrl = process.env.VITE_API_URL || '';
    const envScript = `<script>window.__ENV__ = { VITE_API_URL: "${apiUrl}" };</script>`;
    const modifiedData = data.replace('</head>', `${envScript}</head>`);

    res.send(modifiedData);
  });
};

// 프로덕션 환경에서 정적 파일 서빙
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, '..', '..', '..', 'public');
  // 1. 정적 자산 서빙 (index.html 제외)
  app.use(express.static(publicPath, { index: false }));

  // 2. 루트 및 index.html 요청 처리
  app.get('/', serveIndexHtml);
  app.get('/index.html', serveIndexHtml);
}

// Routes
// 개발 환경에서만 루트 경로에 API 응답
if (process.env.NODE_ENV !== 'production') {
  app.get('/', (req, res) => {
    res.json({ message: 'Jacal API - Productivity Platform' });
  });
}

app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/nlu', nluRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/search', searchRoutes);

// SPA 폴백 (프로덕션 환경)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    serveIndexHtml(req, res);
  });
}

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
