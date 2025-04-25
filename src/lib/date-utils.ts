
import { format as formatDate, formatDistance, formatRelative, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Helper function to format dates in the application's timezone
 * Explicitly parses dates as UTC to prevent double timezone application
 */
export const formatWithTimezone = (date: Date | string | number, formatStr: string, timezone?: string) => {
  // Ensure we're working with a Date object
  const dateObj = typeof date === 'string' ? new Date(date + 'Z') : // Append Z to treat string as UTC
    typeof date === 'number' ? new Date(date) :
    date;

  if (timezone) {
    return formatInTimeZone(dateObj, timezone, formatStr);
  } else {
    return formatDate(dateObj, formatStr);
  }
};

/**
 * Format a time range, respecting the specified timezone
 * Handles UTC dates correctly by appending 'Z' to string dates
 */
export const formatTimeRange = (
  startDate: string | Date, 
  endDate: string | Date, 
  isAllDay: boolean, 
  timezone: string
): string => {
  if (isAllDay) {
    return "All day";
  }

  // Explicitly parse dates as UTC by appending 'Z' to ISO strings
  const start = typeof startDate === 'string' ? new Date(startDate + 'Z') : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate + 'Z') : endDate;
  
  return `${formatInTimeZone(start, timezone, "h:mm a")} - ${formatInTimeZone(end, timezone, "h:mm a")} (${getReadableTimezoneName(timezone)})`;
};

/**
 * Extract a readable timezone name from a timezone identifier
 */
export const getReadableTimezoneName = (timezone: string): string => {
  if (!timezone || !timezone.includes('/')) return timezone;
  return timezone.split('/')[1].replace('_', ' ');
};
