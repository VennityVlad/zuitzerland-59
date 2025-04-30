
import React, { useEffect, useState } from 'react';
import { toast } from "sonner";
import { RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkForUpdates, forceRefresh } from '@/serviceWorkerRegistration';

// Minimum time between update checks (30 minutes)
const CHECK_INTERVAL = 30 * 60 * 1000;

export function UpdateNotification() {
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const handleRefresh = () => {
    forceRefresh();
  };

  useEffect(() => {
    // Check for updates on load
    const checkForUpdate = async () => {
      const result = await checkForUpdates();
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
    
    // Set up periodic checks
    const intervalId = setInterval(checkForUpdate, CHECK_INTERVAL);
    
    return () => {
      document.removeEventListener('appUpdateAvailable', handleUpdateFound);
      clearInterval(intervalId);
    };
  }, []);
  
  useEffect(() => {
    // Show toast when update is available
    if (updateAvailable) {
      toast.custom(
        (id) => (
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <AlertCircle className="h-6 w-6 text-amber-500" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  App update available
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  A new version is available. Reload to update.
                </p>
                <div className="mt-3 flex space-x-4">
                  <Button 
                    size="sm"
                    onClick={() => {
                      toast.dismiss(id);
                      handleRefresh();
                    }}
                    className="flex items-center"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload now
                  </Button>
                  <button
                    type="button"
                    onClick={() => toast.dismiss(id)}
                    className="inline-flex text-sm font-medium text-gray-500 hover:text-gray-700"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        ),
        {
          duration: 0, // Don't auto-dismiss
          id: 'app-update', // Unique ID to prevent duplicates
        }
      );
    }
  }, [updateAvailable]);

  return null; // This is a non-visual component
}
