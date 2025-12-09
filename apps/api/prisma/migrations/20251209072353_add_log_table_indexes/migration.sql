-- CreateIndex
CREATE INDEX "backup_records_createdAt_idx" ON "backup_records"("createdAt");

-- CreateIndex
CREATE INDEX "comments_sharedEventId_createdAt_idx" ON "comments"("sharedEventId", "createdAt");

-- CreateIndex
CREATE INDEX "habit_logs_habitId_completedAt_idx" ON "habit_logs"("habitId", "completedAt");

-- CreateIndex
CREATE INDEX "notification_webhook_logs_webhookId_createdAt_idx" ON "notification_webhook_logs"("webhookId", "createdAt");

-- CreateIndex
CREATE INDEX "notification_webhook_logs_status_createdAt_idx" ON "notification_webhook_logs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "reminders_entityType_entityId_idx" ON "reminders"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "reminders_notifyAt_sent_idx" ON "reminders"("notifyAt", "sent");

-- CreateIndex
CREATE INDEX "shared_events_teamId_startAt_idx" ON "shared_events"("teamId", "startAt");

-- CreateIndex
CREATE INDEX "tasks_userId_status_idx" ON "tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "tasks_userId_dueAt_idx" ON "tasks"("userId", "dueAt");
