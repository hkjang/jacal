/**
 * Timezone utility functions for consistent date/time handling
 * across server and client in different timezone environments.
 */

// Timezone offset mapping (in minutes)
const TIMEZONE_OFFSETS: Record<string, number> = {
    'UTC': 0,
    'Asia/Seoul': 540,      // UTC+9
    'Asia/Tokyo': 540,      // UTC+9
    'America/New_York': -300, // UTC-5 (EST) / -240 (EDT)
    'America/Los_Angeles': -480, // UTC-8 (PST) / -420 (PDT)
    'Europe/London': 0,     // UTC+0 (GMT) / +60 (BST)
    'Europe/Paris': 60,     // UTC+1 (CET) / +120 (CEST)
};

/**
 * Get the UTC offset in minutes for a given timezone.
 * Returns 540 (UTC+9) for Asia/Seoul as default.
 */
export function getTimezoneOffset(timezone: string): number {
    return TIMEZONE_OFFSETS[timezone] ?? 540; // Default to Asia/Seoul
}

/**
 * Get the current date/time formatted for display in a specific timezone.
 * Returns an ISO-like string but adjusted for the timezone.
 * 
 * @param timezone - IANA timezone string (e.g., 'Asia/Seoul')
 * @returns Formatted date string in the specified timezone
 */
export function getCurrentTimeForTimezone(timezone: string): string {
    const now = new Date();
    const offsetMinutes = getTimezoneOffset(timezone);

    // Create a new date adjusted for the timezone offset
    const adjustedTime = new Date(now.getTime() + offsetMinutes * 60 * 1000);

    // Format as YYYY-MM-DD HH:mm:ss (timezone name)
    const year = adjustedTime.getUTCFullYear();
    const month = String(adjustedTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(adjustedTime.getUTCDate()).padStart(2, '0');
    const hours = String(adjustedTime.getUTCHours()).padStart(2, '0');
    const minutes = String(adjustedTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(adjustedTime.getUTCSeconds()).padStart(2, '0');

    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${offsetStr}`;
}

/**
 * Get timezone offset string (e.g., "+09:00" for Asia/Seoul)
 */
export function getTimezoneOffsetString(timezone: string): string {
    const offsetMinutes = getTimezoneOffset(timezone);
    const offsetHours = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMins = Math.abs(offsetMinutes) % 60;
    const offsetSign = offsetMinutes >= 0 ? '+' : '-';
    return `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMins).padStart(2, '0')}`;
}

/**
 * Parse a date string in a specific timezone context and return a UTC Date.
 * Useful for interpreting LLM-generated dates that are in user's local time.
 * 
 * @param dateString - ISO date string (may or may not include timezone)
 * @param timezone - User's timezone for context
 * @returns Date object in UTC
 */
export function parseInTimezone(dateString: string, timezone: string): Date {
    // If the date string already has timezone info, parse as-is
    if (dateString.includes('+') || dateString.includes('Z') || dateString.match(/T\d{2}:\d{2}:\d{2}-/)) {
        return new Date(dateString);
    }

    // Otherwise, treat the time as being in the specified timezone
    const offsetMinutes = getTimezoneOffset(timezone);
    const localDate = new Date(dateString);

    // Adjust to UTC by subtracting the timezone offset
    return new Date(localDate.getTime() - offsetMinutes * 60 * 1000);
}
