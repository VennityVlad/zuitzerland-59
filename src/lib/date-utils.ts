
import { format, formatDistance, formatRelative, formatDistanceToNow } from 'date-fns';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

/**
 * Convert local time to UTC for storage
 * @param dateStr The date string in local time
 * @param timeStr The time string in local time
 * @param timezone The timezone to interpret the local time in
 * @returns UTC Date object
 */
export const toUTCDate = (dateStr: string, timeStr: string, timezone: string): Date => {
  const fullLocalString = `${dateStr}T${timeStr}`;
  console.log('toUTCDate input:', { dateStr, timeStr, timezone, fullLocalString });
  const zonedTime = toZonedTime(new Date(fullLocalString), timezone);
  console.log('toUTCDate output:', { zonedTime, zonedTimeISO: zonedTime.toISOString() });
  return zonedTime;
};

/**
 * Default date formatting function
 * @param date The date to format
 * @param formatStr The format string to use
 * @returns Formatted date string
 */
export const formatDate = (date: Date | string | number, formatStr: string) => {
  try {
    return format(date, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Helper function to format dates in the application's timezone
 * @param date The date to format
 * @param formatStr The format string to use
 * @param timezone Optional timezone, defaults to the event's own timezone
 * @returns Formatted date string
 */
export const formatWithTimezone = (date: Date | string | number, formatStr: string, timezone?: string) => {
  try {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    // Check if the date is valid before formatting
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    if (timezone) {
      return formatInTimeZone(dateObj, timezone, formatStr);
    } else {
      return formatDate(dateObj, formatStr);
    }
  } catch (error) {
    console.error('Error formatting date with timezone:', error);
    return '';
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

  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    // Validate dates before formatting
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date');
    }
    
    return `${formatInTimeZone(start, timezone, "h:mm a")} - ${formatInTimeZone(end, timezone, "h:mm a")} (${getReadableTimezoneName(timezone)})`;
  } catch (error) {
    console.error('Error formatting time range:', error);
    return '';
  }
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

/**
 * Convert a date from a specific timezone to UTC
 * This ensures that when a user selects, for example, 2PM in Europe/Zurich,
 * it's stored as 12PM UTC in the database
 * 
 * @param date The date to convert
 * @param timezone The timezone the date is in
 * @returns The UTC date as a string in ISO format
 */
export const convertToUTC = (date: Date | string, timezone: string): string => {
  console.log('convertToUTC input:', { 
    date: typeof date === 'string' ? date : date.toString(), 
    dateType: typeof date,
    timezone 
  });

  try {
    // First make sure we have a Date object
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
    
    console.log('dateObj created:', { dateObj: dateObj.toString(), dateObjISO: dateObj.toISOString() });
    
    // Create a zoned time directly from the date object and the target timezone
    const zonedDate = toZonedTime(dateObj, timezone);
    console.log('zonedDate:', { 
      zonedDate: zonedDate.toString(),
      zonedDateISO: zonedDate.toISOString(),
      zonedTimestamp: zonedDate.getTime(),
      browserTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      targetTimezone: timezone
    });
    
    // Now convert to UTC ISO string
    const result = zonedDate.toISOString();
    console.log('convertToUTC final result:', result);
    
    return result;
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return '';
  }
};
