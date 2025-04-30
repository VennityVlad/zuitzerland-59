
/**
 * Version utilities for the application
 * These functions help manage and track the application version
 */

// Get the current application version from the environment or a fixed value
export const getCurrentVersion = (): string => {
  return import.meta.env.VITE_APP_VERSION || '2025-04-30-v1';
};

// Compare two version strings
export const isNewerVersion = (currentVersion: string, newVersion: string): boolean => {
  if (currentVersion === newVersion) return false;
  
  // Simple string comparison for date-based versions
  if (currentVersion.startsWith('20') && newVersion.startsWith('20')) {
    return newVersion > currentVersion;
  }
  
  // For semver versions, implement proper comparison logic
  const currentParts = currentVersion.split('.').map(Number);
  const newParts = newVersion.split('.').map(Number);
  
  // Compare major, minor, patch
  for (let i = 0; i < Math.min(currentParts.length, newParts.length); i++) {
    if (newParts[i] > currentParts[i]) return true;
    if (newParts[i] < currentParts[i]) return false;
  }
  
  // If all common parts are equal, the longer one is newer
  return newParts.length > currentParts.length;
};

// Format build date into human readable string
export const formatBuildDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (e) {
    return 'Unknown date';
  }
};
