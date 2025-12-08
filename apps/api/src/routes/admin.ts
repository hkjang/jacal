import { Router } from 'express';
import usersRouter from './admin/users';
import contentRouter from './admin/content';
import systemRouter from './admin/system';
import analyticsRouter from './admin/analytics';
import databaseRouter from './admin/database';
import backupsRouter from './admin/backups';
import settingsRouter from './admin/settings';
import webhooksRouter from './admin/webhooks';
import integrationsRouter from './admin/integrations';
import emailRouter from './admin/email';
import teamsRouter from './admin/teams';
import notificationWebhooksRouter from './admin/notification-webhooks';
import remindersRouter from './admin/reminders';

const router = Router();

// Mount sub-routers
router.use('/users', usersRouter);
router.use('/', contentRouter); // events, habits, tasks
router.use('/', systemRouter); // stats, system-stats, health, logs
router.use('/analytics', analyticsRouter); // usage, performance, adoption
router.use('/database', databaseRouter); // database stats
router.use('/backups', backupsRouter); // backup management
router.use('/settings', settingsRouter); // app settings
router.use('/webhooks', webhooksRouter); // webhook management
router.use('/integrations', integrationsRouter); // integration management
router.use('/email', emailRouter); // email settings
router.use('/teams', teamsRouter); // team management
router.use('/notification-webhooks', notificationWebhooksRouter); // notification webhook management
router.use('/reminders', remindersRouter); // reminders management

export default router;
