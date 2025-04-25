
import { format as formatDate, formatDistance, formatRelative, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * Helper function to format dates in the application's timezone
 * Explicitly parses dates as UTC to prevent double timezone application
 */
export const formatWithTimezone = (date: Date | string | number, formatStr: string, timezone?: string) => {
  try {
    // Ensure we're working with a Date object
    const dateObj = typeof date === 'string' ? new Date(date + 'Z') : // Append Z to treat string as UTC
      typeof date === 'number' ? new Date(date) :
      date;

    // Check if date is valid before formatting
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided to formatWithTimezone:', date);
      return 'Invalid date';
    }

    if (timezone) {
      return formatInTimeZone(dateObj, timezone, formatStr);
    } else {
      return formatDate(dateObj, formatStr);
    }
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return 'Invalid date';
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

  try {
    // Explicitly parse dates as UTC by appending 'Z' to ISO strings
    const start = typeof startDate === 'string' ? new Date(startDate + 'Z') : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate + 'Z') : endDate;
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('Invalid date provided to formatTimeRange:', { startDate, endDate });
      return 'Invalid time range';
    }
    
    // Use a default timezone if none is provided
    const safeTimezone = timezone || 'UTC';
    
    return `${formatInTimeZone(start, safeTimezone, "h:mm a")} - ${formatInTimeZone(end, safeTimezone, "h:mm a")} (${getReadableTimezoneName(safeTimezone)})`;
  } catch (error) {
    console.error('Error formatting time range:', error);
    return 'Invalid time range';
  }
};

/**
 * Extract a readable timezone name from a timezone identifier
 * Safely handles null, undefined, or malformed timezone strings
 */
export const getReadableTimezoneName = (timezone: string | null | undefined): string => {
  if (!timezone) return 'UTC';
  if (!timezone.includes('/')) return timezone;
  
  try {
    const parts = timezone.split('/');
    return parts.length > 1 ? parts[1].replace('_', ' ') : timezone;
  } catch (error) {
    console.error('Error parsing timezone name:', error);
    return 'UTC';
  }
};
