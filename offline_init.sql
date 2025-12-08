-- Enable UUID extension if needed (Prisma usually handles this in client, but good for DB)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enums
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'USER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "EventType" AS ENUM ('WORK', 'PERSONAL', 'MEETING', 'APPOINTMENT', 'OTHER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Table: users
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "preferences" JSONB,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email");

-- Table: connected_accounts
CREATE TABLE IF NOT EXISTS "connected_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "connected_accounts_userId_provider_key" ON "connected_accounts"("userId", "provider");
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: tasks
CREATE TABLE IF NOT EXISTS "tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueAt" TIMESTAMP(3),
    "estimatedMinutes" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tasks" ADD CONSTRAINT "tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: events
CREATE TABLE IF NOT EXISTS "events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "eventType" "EventType" NOT NULL DEFAULT 'OTHER',
    "isAllDay" BOOLEAN NOT NULL DEFAULT false,
    "isFocusTime" BOOLEAN NOT NULL DEFAULT false,
    "sourceCalendar" TEXT,
    "externalId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "events" ADD CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: recurring_rules
CREATE TABLE IF NOT EXISTS "recurring_rules" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "eventId" TEXT,
    "rruleText" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recurring_rules_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "recurring_rules_taskId_key" ON "recurring_rules"("taskId");
CREATE UNIQUE INDEX IF NOT EXISTS "recurring_rules_eventId_key" ON "recurring_rules"("eventId");
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "recurring_rules" ADD CONSTRAINT "recurring_rules_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: reminders
CREATE TABLE IF NOT EXISTS "reminders" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "notifyAt" TIMESTAMP(3) NOT NULL,
    "channel" TEXT NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- Table: tags
CREATE TABLE IF NOT EXISTS "tags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tags_userId_name_key" ON "tags"("userId", "name");
ALTER TABLE "tags" ADD CONSTRAINT "tags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: analytics
CREATE TABLE IF NOT EXISTS "analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "focusMinutes" INTEGER NOT NULL DEFAULT 0,
    "meetingMinutes" INTEGER NOT NULL DEFAULT 0,
    "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
    "tasksPlanned" INTEGER NOT NULL DEFAULT 0,
    "eventsAttended" INTEGER NOT NULL DEFAULT 0,
    "productivityScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "analytics_userId_date_key" ON "analytics"("userId", "date");
ALTER TABLE "analytics" ADD CONSTRAINT "analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: user_settings
CREATE TABLE IF NOT EXISTS "user_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ollamaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ollamaBaseUrl" TEXT,
    "ollamaModel" TEXT,
    "pop3Enabled" BOOLEAN NOT NULL DEFAULT false,
    "pop3Host" TEXT,
    "pop3Port" INTEGER,
    "pop3User" TEXT,
    "pop3Password" TEXT,
    "pop3Tls" BOOLEAN NOT NULL DEFAULT true,
    "savedLocations" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_settings_userId_key" ON "user_settings"("userId");
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: webhook_configs
CREATE TABLE IF NOT EXISTS "webhook_configs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "url" TEXT,
    "columnMapping" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_configs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "webhook_configs_userId_key" ON "webhook_configs"("userId");
ALTER TABLE "webhook_configs" ADD CONSTRAINT "webhook_configs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: processed_emails
CREATE TABLE IF NOT EXISTS "processed_emails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "uidl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_emails_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "processed_emails_userId_uidl_key" ON "processed_emails"("userId", "uidl");
ALTER TABLE "processed_emails" ADD CONSTRAINT "processed_emails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: habits
CREATE TABLE IF NOT EXISTS "habits" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL,
    "targetDays" INTEGER NOT NULL DEFAULT 7,
    "color" TEXT,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "habits_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "habits" ADD CONSTRAINT "habits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: habit_logs
CREATE TABLE IF NOT EXISTS "habit_logs" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "habit_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "habit_logs" ADD CONSTRAINT "habit_logs_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "habits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: teams
CREATE TABLE IF NOT EXISTS "teams" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

-- Table: team_members
CREATE TABLE IF NOT EXISTS "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "team_members_teamId_userId_key" ON "team_members"("teamId", "userId");
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: shared_events
CREATE TABLE IF NOT EXISTS "shared_events" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shared_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "shared_events" ADD CONSTRAINT "shared_events_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "shared_events" ADD CONSTRAINT "shared_events_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: comments
CREATE TABLE IF NOT EXISTS "comments" (
    "id" TEXT NOT NULL,
    "sharedEventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "comments" ADD CONSTRAINT "comments_sharedEventId_fkey" FOREIGN KEY ("sharedEventId") REFERENCES "shared_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Table: app_settings
CREATE TABLE IF NOT EXISTS "app_settings" (
    "id" TEXT NOT NULL,
    "siteName" TEXT NOT NULL DEFAULT 'Jacal',
    "siteUrl" TEXT NOT NULL DEFAULT 'http://localhost:5173',
    "defaultLanguage" TEXT NOT NULL DEFAULT 'ko',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Seoul',
    "allowRegistration" BOOLEAN NOT NULL DEFAULT true,
    "requireEmailVerification" BOOLEAN NOT NULL DEFAULT false,
    "maxUploadSizeMB" INTEGER NOT NULL DEFAULT 10,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);

-- Table: webhooks
CREATE TABLE IF NOT EXISTS "webhooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- Table: integrations
CREATE TABLE IF NOT EXISTS "integrations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "provider" TEXT,
    "apiKey" TEXT,
    "config" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "integrations_name_key" ON "integrations"("name");

-- Table: email_settings
CREATE TABLE IF NOT EXISTS "email_settings" (
    "id" TEXT NOT NULL,
    "smtpHost" TEXT NOT NULL,
    "smtpPort" INTEGER NOT NULL,
    "smtpUser" TEXT NOT NULL,
    "smtpPassword" TEXT NOT NULL,
    "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
    "fromName" TEXT NOT NULL,
    "fromEmail" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_settings_pkey" PRIMARY KEY ("id")
);

-- Table: backup_records
CREATE TABLE IF NOT EXISTS "backup_records" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "backup_records_pkey" PRIMARY KEY ("id")
);

-- Table: notification_webhooks
CREATE TABLE IF NOT EXISTS "notification_webhooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "headers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_webhooks_pkey" PRIMARY KEY ("id")
);

-- Table: notification_webhook_logs
CREATE TABLE IF NOT EXISTS "notification_webhook_logs" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "reminderId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "statusCode" INTEGER,
    "response" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_webhook_logs_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "notification_webhook_logs" ADD CONSTRAINT "notification_webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "notification_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- IMPLICIT Many-to-Many Tables (Prisma convention)

-- _TaskTags
CREATE TABLE IF NOT EXISTS "_TaskTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_TaskTags_AB_unique" ON "_TaskTags"("A", "B");
CREATE INDEX IF NOT EXISTS "_TaskTags_B_index" ON "_TaskTags"("B");
ALTER TABLE "_TaskTags" ADD CONSTRAINT "_TaskTags_A_fkey" FOREIGN KEY ("A") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TaskTags" ADD CONSTRAINT "_TaskTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- _EventTags
CREATE TABLE IF NOT EXISTS "_EventTags" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "_EventTags_AB_unique" ON "_EventTags"("A", "B");
CREATE INDEX IF NOT EXISTS "_EventTags_B_index" ON "_EventTags"("B");
ALTER TABLE "_EventTags" ADD CONSTRAINT "_EventTags_A_fkey" FOREIGN KEY ("A") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_EventTags" ADD CONSTRAINT "_EventTags_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert Sample Data

INSERT INTO "users" ("id", "email", "name", "passwordHash", "timezone", "isAdmin", "role", "createdAt", "updatedAt")
VALUES
('user-uuid-1', 'admin@example.com', 'Admin User', '$2b$10$EpIxNwV...dummyhash...', 'Asia/Seoul', true, 'ADMIN', NOW(), NOW()),
('user-uuid-2', 'user@example.com', 'Normal User', '$2b$10$EpIxNwV...dummyhash...', 'Asia/Seoul', false, 'USER', NOW(), NOW());

INSERT INTO "tags" ("id", "userId", "name", "color", "createdAt")
VALUES
('tag-1', 'user-uuid-1', 'Important', '#ff0000', NOW()),
('tag-2', 'user-uuid-1', 'Work', '#0000ff', NOW()),
('tag-3', 'user-uuid-2', 'Personal', '#00ff00', NOW());

INSERT INTO "tasks" ("id", "userId", "title", "description", "status", "priority", "createdAt", "updatedAt")
VALUES
('task-1', 'user-uuid-1', 'Setup Database', 'Complete the offline setup script', 'pending', 1, NOW(), NOW()),
('task-2', 'user-uuid-2', 'Buy Milk', 'Grocery shopping', 'pending', 0, NOW(), NOW());

INSERT INTO "events" ("id", "userId", "title", "description", "startAt", "endAt", "eventType", "createdAt", "updatedAt")
VALUES
('event-1', 'user-uuid-1', 'Team Meeting', 'Weekly sync', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '1 hour', 'MEETING', NOW(), NOW()),
('event-2', 'user-uuid-2', 'Lunch', 'Lunch with friend', NOW() + INTERVAL '2 day', NOW() + INTERVAL '2 day' + INTERVAL '1 hour', 'PERSONAL', NOW(), NOW());

-- Link Tag to Task (Tag 'Important' to Task 'Setup Database')
-- _TaskTags: A (Tag), B (Task)
INSERT INTO "_TaskTags" ("A", "B") VALUES ('tag-1', 'task-1');

-- Link Tag to Event (Event 'Lunch' to Tag 'Personal')
-- _EventTags: A (Event), B (Tag)
INSERT INTO "_EventTags" ("A", "B") VALUES ('event-2', 'tag-3');

