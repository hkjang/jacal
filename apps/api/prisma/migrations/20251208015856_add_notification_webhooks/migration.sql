-- CreateTable
CREATE TABLE "notification_webhooks" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "headers" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_webhook_logs" (
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

-- AddForeignKey
ALTER TABLE "notification_webhook_logs" ADD CONSTRAINT "notification_webhook_logs_webhookId_fkey" FOREIGN KEY ("webhookId") REFERENCES "notification_webhooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
