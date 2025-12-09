-- AlterTable
ALTER TABLE "users" ALTER COLUMN "timezone" SET DEFAULT 'Asia/Seoul';

-- CreateIndex
CREATE INDEX "events_userId_startAt_idx" ON "events"("userId", "startAt");
