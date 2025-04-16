
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A custom hook to track page views with Plausible Analytics
 * With error handling for CORS issues
 */
export const usePageTracking = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Only track if Plausible is loaded
    if (window.plausible) {
      try {
        // Use no-cors mode to prevent CORS errors
        window.plausible('pageview', { mode: 'no-cors' });
      } catch (error) {
        console.warn('Failed to track page view with Plausible:', error);
      }
    }
  }, [location.pathname]); // Track when path changes
};

// Add this to make TypeScript happy
declare global {
  interface Window {
    plausible?: (event: string, options?: any) => void;
  }
}
