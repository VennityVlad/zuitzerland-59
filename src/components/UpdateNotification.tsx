
import React, { useEffect, useState } from 'react';
import { checkForUpdates, forceRefresh } from '@/serviceWorkerRegistration';

// Minimum time between update checks (30 minutes)
const CHECK_INTERVAL = 30 * 60 * 1000;

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isPreviewEnv, setIsPreviewEnv] = useState(false);

  useEffect(() => {
    // Check for updates on load
    const checkForUpdate = async () => {
      const result = await checkForUpdates();
      if (result.previewEnvironment) {
        setIsPreviewEnv(true);
        return;
      }
      
      if (result.updateAvailable) {
        setUpdateAvailable(true);
      }
    };
    
    checkForUpdate();
    
    // Listen for update notifications from service worker
    const handleUpdateFound = () => {
      setUpdateAvailable(true);
    };
    
    document.addEventListener('appUpdateAvailable', handleUpdateFound);
    
    // Set up periodic checks (only if not in preview)
    let intervalId: number | undefined;
    if (!isPreviewEnv) {
      intervalId = window.setInterval(checkForUpdate, CHECK_INTERVAL);
    }
    
    return () => {
      document.removeEventListener('appUpdateAvailable', handleUpdateFound);
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPreviewEnv]);
  
  // In preview environments, we can optionally show a developer indicator
  useEffect(() => {
    if (isPreviewEnv && process.env.NODE_ENV === 'development') {
      console.log('Running in Lovable preview environment - service worker disabled');
    }
  }, [isPreviewEnv]);

  return null; // This is a non-visual component
}
