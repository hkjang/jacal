import prisma from '../lib/prisma';

interface ColumnMapping {
  [key: string]: string; // Maps source column to target column
}

export type WebhookAction = 'create' | 'update' | 'delete' | 'test';

// Event type mapping for admin webhooks
const actionToEventMap: Record<string, string[]> = {
  'create': ['event.created', 'task.created', 'user.created'],
  'update': ['event.updated', 'task.updated', 'user.updated'],
  'delete': ['event.deleted', 'task.deleted', 'user.deleted'],
};

export async function triggerWebhook(userId: string, action: WebhookAction, eventData: any, entityType?: string): Promise<void> {
  // Trigger user-specific webhook
  await triggerUserWebhook(userId, action, eventData);

  // Trigger admin webhooks (global)
  if (action !== 'test') {
    await triggerAdminWebhooks(action, eventData, entityType);
  }
}

// User-specific webhook
async function triggerUserWebhook(userId: string, action: WebhookAction, eventData: any): Promise<void> {
  try {
    // Get user's webhook config
    const config = await prisma.webhookConfig.findUnique({
      where: { userId },
    });

    if (!config || !config.enabled || !config.url) {
      console.log('Webhook not configured or disabled for user:', userId);
      return;
    }

    // Apply column mapping
    const mappedData = applyColumnMapping(eventData, config.columnMapping as ColumnMapping | null);

    // Construct final payload
    const payload = {
      action,
      timestamp: new Date().toISOString(),
      data: mappedData,
    };

    console.log(`Triggering user webhook (${action}):`, config.url);

    // Send webhook request
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('User webhook failed:', response.status, await response.text());
    } else {
      console.log('User webhook sent successfully');
    }
  } catch (error) {
    console.error('User webhook error:', error);
    // Don't throw - webhook failures shouldn't break the main flow
  }
}

// Admin/Global webhooks
async function triggerAdminWebhooks(action: WebhookAction, eventData: any, entityType?: string): Promise<void> {
  try {
    // Determine which event types to match
    const eventTypes: string[] = [];

    if (entityType) {
      // If entity type is specified, use it directly
      eventTypes.push(`${entityType}.${action === 'create' ? 'created' : action === 'update' ? 'updated' : 'deleted'}`);
    } else {
      // Otherwise, check common event types
      const mappedEvents = actionToEventMap[action] || [];
      eventTypes.push(...mappedEvents);
    }

    // Get all active admin webhooks that match these events
    const webhooks = await prisma.webhook.findMany({
      where: {
        active: true,
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    // Filter webhooks that have matching events
    const matchingWebhooks = webhooks.filter(webhook => {
      const webhookEvents = webhook.events as string[] || [];
      // If webhook has no specific events, trigger for all
      if (webhookEvents.length === 0) {
        return true;
      }
      // Check if any event matches
      return eventTypes.some(et => webhookEvents.includes(et));
    });

    if (matchingWebhooks.length === 0) {
      return;
    }

    console.log(`Triggering ${matchingWebhooks.length} admin webhook(s) for events:`, eventTypes);

    // Construct payload
    const payload = {
      event: eventTypes[0] || `${entityType || 'unknown'}.${action}`,
      action,
      timestamp: new Date().toISOString(),
      data: eventData,
    };

    // Send to all matching webhooks
    const promises = matchingWebhooks.map(async (webhook) => {
      try {
        console.log(`Sending admin webhook "${webhook.name}" to:`, webhook.url);

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          console.error(`Admin webhook "${webhook.name}" failed:`, response.status);
        } else {
          console.log(`Admin webhook "${webhook.name}" sent successfully`);
        }
      } catch (err) {
        console.error(`Admin webhook "${webhook.name}" error:`, err);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Admin webhooks error:', error);
    // Don't throw - webhook failures shouldn't break the main flow
  }
}

function applyColumnMapping(data: any, mapping: ColumnMapping | null): any {
  if (!data) return {};

  if (!mapping || Object.keys(mapping).length === 0) {
    return data; // No mapping, return original data
  }

  const result: any = {};

  // Apply mapping
  for (const [sourceKey, targetKey] of Object.entries(mapping)) {
    if (data[sourceKey] !== undefined) {
      result[targetKey] = data[sourceKey];
    }
  }

  // Include unmapped fields
  for (const key in data) {
    if (!mapping[key]) {
      result[key] = data[key];
    }
  }

  return result;
}

