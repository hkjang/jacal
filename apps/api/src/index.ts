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
const buildAllowedOrigins = (): string[] => {
  const origins = new Set<string>();

  // 기본 개발 환경 origins
  origins.add('http://localhost:5173');
  origins.add('http://localhost:3000');

  // CORS_ORIGINS 환경변수에서 추가
  if (process.env.CORS_ORIGINS) {
    process.env.CORS_ORIGINS.split(',').forEach(origin => {
      const trimmed = origin.trim();
      if (trimmed) origins.add(trimmed);
    });
  }

  // VITE_API_URL이 설정되어 있으면 자동으로 허용 목록에 추가
  if (process.env.VITE_API_URL) {
    try {
      const apiUrl = new URL(process.env.VITE_API_URL);
      origins.add(apiUrl.origin);
    } catch (e) {
      console.warn('Invalid VITE_API_URL format:', process.env.VITE_API_URL);
    }
  }

  return Array.from(origins);
};

const allowedOrigins = buildAllowedOrigins();
const isProduction = process.env.NODE_ENV === 'production';
console.log('🔒 CORS Allowed Origins:', allowedOrigins);
console.log('🌐 Production mode:', isProduction);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Same-Origin 요청 허용 (origin이 undefined인 경우 - 프로덕션에서 정적 파일과 같은 서버에서 요청)
    if (!origin) {
      return callback(null, true);
    }

    // 허용된 origin 목록에 있는 경우
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // localhost 또는 127.0.0.1 변형 허용 (개발 환경)
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }

    // 프로덕션 환경에서는 IP 주소 기반 요청도 허용 (오프라인 환경 지원)
    // IP 주소 패턴: http(s)://숫자.숫자.숫자.숫자(:포트)
    if (isProduction && /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?$/.test(origin)) {
      console.log(`✅ CORS allowing IP-based origin in production: ${origin}`);
      return callback(null, true);
    }

    console.warn(`⚠️ CORS blocked request from origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
