import OpenAI from 'openai';
import prisma from '../lib/prisma';
import { getCurrentTimeForTimezone, getTimezoneOffsetString } from '../lib/timezone';

export interface ParsedEntity {
  action: 'create' | 'update' | 'delete';
  type: 'task' | 'event';
  title: string;
  searchTitle?: string; // For update/delete: the title to search for
  description?: string;
  dueAt?: string; // ISO string
  startAt?: string; // ISO string
  endAt?: string; // ISO string
  estimatedMinutes?: number;
  priority?: number;
  location?: string;
  preparationTask?: {
    title: string;
    estimatedMinutes: number;
  };
}

async function getOpenAIClient(userId: string): Promise<{ client: OpenAI; model: string }> {
  // Try to get user settings first
  const userSettings = await prisma.userSettings.findUnique({
    where: { userId },
  });

  // Determine if using Ollama or OpenAI
  const useOllama = userSettings?.ollamaEnabled || !process.env.OPENAI_API_KEY;

  if (useOllama) {
    const ollamaBaseURL = userSettings?.ollamaBaseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434/v1';
    const ollamaModel = userSettings?.ollamaModel || process.env.OLLAMA_MODEL || 'gpt-oss:20b';

    console.log(`Using user's Ollama config: ${ollamaBaseURL}, model: ${ollamaModel}`);

    return {
      client: new OpenAI({
        apiKey: 'ollama',
        baseURL: ollamaBaseURL,
      }),
      model: ollamaModel,
    };
  } else {
    console.log('Using OpenAI API');
    return {
      client: new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      }),
      model: 'gpt-4o-mini',
    };
  }
}

export async function parseNaturalLanguage(input: string, userId: string, timezone: string = 'UTC'): Promise<ParsedEntity[]> {
  try {
    // Get user-specific OpenAI client
    const { client, model } = await getOpenAIClient(userId);

    const systemPrompt = `You are a natural language parser for a productivity app. Parse user input and extract tasks or events with their intended action.
Current timezone: ${timezone} (UTC${getTimezoneOffsetString(timezone)})
Current date/time: ${getCurrentTimeForTimezone(timezone)}

Rules:
1. Determine the ACTION: "create", "update", or "delete"
   - Keywords for delete: 삭제, 지워, 취소, remove, delete, cancel
   - Keywords for update: 수정, 변경, 미뤄, 당겨, 바꿔, change, modify, reschedule, move
   - Default to "create" if no delete/update intent is detected
2. Determine if the input describes a task or an event
3. Extract title, times, durations, locations, priorities
4. For delete/update actions: set "searchTitle" to identify the target event/task
5. For update actions: set new values in the appropriate fields
6. If preparation time is mentioned (e.g., "준비 30분", "prep 20 min"), create a separate preparation task
7. Return a JSON array of entities

Response format (MUST be valid JSON):
{
  "entities": [
    {
      "action": "create" | "update" | "delete",
      "type": "event" | "task",
      "title": string,
      "searchTitle": string (required for update/delete - the title to search for),
      "description": string (optional),
      "dueAt": ISO datetime string (for tasks),
      "startAt": ISO datetime string (for events, required for create),
      "endAt": ISO datetime string (for events),
      "estimatedMinutes": number (optional),
      "priority": 0-5 (optional, higher is more important),
      "location": string (optional),
      "preparationTask": { "title": string, "estimatedMinutes": number } (optional)
    }
  ]
}`;

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error('No response from LLM');
    }

    console.log('LLM Response:', responseText);

    // Clean up response text (remove markdown code blocks if present)
    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleanedResponse);

    // Handle both array and object responses
    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.entities && Array.isArray(parsed.entities)) {
      return parsed.entities;
    } else if (parsed.type) {
      return [parsed];
    }

    return [];
  } catch (error) {
    console.error('NLU parsing error:', error);
    throw error;
  }
}

export async function parseEmailContent(subject: string, body: string, userId: string, timezone: string = 'UTC'): Promise<ParsedEntity[]> {
  try {
    const { client, model } = await getOpenAIClient(userId);

    const systemPrompt = `You are a personal assistant that extracts schedule information from emails.
Current timezone: ${timezone} (UTC${getTimezoneOffsetString(timezone)})
Current date/time: ${getCurrentTimeForTimezone(timezone)}

Rules:
1. Analyze the email subject and body.
2. Extract any events or tasks mentioned.
3. Ignore signatures, disclaimers, and irrelevant text.
4. If multiple events are found, return all of them.
5. If no clear event/task is found, return an empty array.

Response format (MUST be valid JSON):
{
  "entities": [
    {
      "type": "event" | "task",
      "title": string,
      "description": string (optional),
      "dueAt": ISO datetime string (for tasks),
      "startAt": ISO datetime string (for events),
      "endAt": ISO datetime string (for events),
      "location": string (optional)
    }
  ]
}`;

    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Subject: ${subject}\n\nBody:\n${body}` },
      ],
      temperature: 0.1, // Lower temperature for more deterministic extraction
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) return [];

    console.log('Email Parsing Response:', responseText);

    let cleanedResponse = responseText.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    const parsed = JSON.parse(cleanedResponse);

    if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed.entities && Array.isArray(parsed.entities)) {
      return parsed.entities;
    } else if (parsed.type) {
      return [parsed];
    }

    return [];
  } catch (error) {
    console.error('Email parsing error:', error);
    return []; // Return empty on error to avoid crashing the batch
  }
}
