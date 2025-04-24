
import { format as formatDate, formatDistance, formatRelative, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Helper function to format dates in the application's timezone
 * @param date The date to format
 * @param formatStr The format string to use
 * @param timezone Optional timezone, defaults to the event's own timezone
 * @returns Formatted date string
 */
export const formatWithTimezone = (date: Date | string | number, formatStr: string, timezone?: string) => {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  if (timezone) {
    return formatInTimeZone(dateObj, timezone, formatStr);
  } else {
    return formatDate(dateObj, formatStr);
  }
};

/**
 * Format a time range, respecting the specified timezone
 * @param startDate Start date string
 * @param endDate End date string
 * @param isAllDay Whether this is an all-day event
 * @param timezone The timezone to use for formatting
 * @returns Formatted time string
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

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return `${formatInTimeZone(start, timezone, "h:mm a")} - ${formatInTimeZone(end, timezone, "h:mm a")} (${getReadableTimezoneName(timezone)})`;
};

/**
 * Extract a readable timezone name from a timezone identifier
 * @param timezone The timezone identifier (e.g. "Europe/Zurich")
 * @returns A readable timezone name (e.g. "Zurich")
 */
export const getReadableTimezoneName = (timezone: string): string => {
  if (!timezone || !timezone.includes('/')) return timezone;
  return timezone.split('/')[1].replace('_', ' ');
};
