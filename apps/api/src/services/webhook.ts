import prisma from '../lib/prisma';

interface ColumnMapping {
  [key: string]: string; // Maps source column to target column
}

export type WebhookAction = 'create' | 'update' | 'delete' | 'test';

export async function triggerWebhook(userId: string, action: WebhookAction, eventData: any): Promise<void> {
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

    console.log(`Triggering webhook (${action}):`, config.url);
    
    // Send webhook request
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error('Webhook failed:', response.status, await response.text());
    } else {
      console.log('Webhook sent successfully');
    }
  } catch (error) {
    console.error('Webhook error:', error);
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
