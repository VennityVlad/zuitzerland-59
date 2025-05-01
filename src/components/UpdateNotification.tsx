
import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkForUpdates, forceRefresh } from '@/serviceWorkerRegistration';

// Minimum time between update checks (30 minutes)
const CHECK_INTERVAL = 30 * 60 * 1000;

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isPreviewEnv, setIsPreviewEnv] = useState(false);

  const handleRefresh = () => {
    forceRefresh();
  };

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
  
  useEffect(() => {
    // Show toast when update is available (only if not in preview)
    if (updateAvailable && !isPreviewEnv) {
      toast(
        (t) => (
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="font-medium text-sm">App update available</div>
              <div className="text-xs text-muted-foreground mt-1">A new version is available</div>
            </div>
            <Button 
              size="sm" 
              className="h-8 gap-1 whitespace-nowrap"
              onClick={() => {
                toast.dismiss(t);
                handleRefresh();
              }}
            >
              <RefreshCw className="h-3 w-3" />
              <span>Reload now</span>
            </Button>
          </div>
        ),
        {
          duration: 0,
          position: 'bottom-right',
          id: 'app-update',
        }
      );
    }

    // In preview environments, we can optionally show a developer indicator
    if (isPreviewEnv && process.env.NODE_ENV === 'development') {
      console.log('Running in Lovable preview environment - service worker disabled');
    }
  }, [updateAvailable, isPreviewEnv]);

  return null; // This is a non-visual component
}
