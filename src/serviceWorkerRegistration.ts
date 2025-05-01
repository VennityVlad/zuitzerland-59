
// This service worker can be customized!
// https://developers.google.com/web/tools/workbox/modules/workbox-sw

// Version of the app, update this when deploying new versions
const APP_VERSION = '2025-05-01-v1';

// Cache name includes version to ensure proper cache invalidation
const CACHE_NAME = `app-cache-${APP_VERSION}`;

// Files to precache
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other static assets that should be cached
];

// Check if we're in the Lovable preview environment
const isPreviewEnvironment = (): boolean => {
  return window.location.hostname.includes('lovableproject.com') || 
         window.location.hostname.includes('lovable.dev') ||
         window.location.hostname.includes('localhost');
};

export function register() {
  // Skip service worker registration in preview environments
  if (isPreviewEnvironment()) {
    console.log('ServiceWorker registration skipped in preview environment');
    return;
  }

  if ('serviceWorker' in navigator) {
    const swUrl = `${window.location.origin}/service-worker.js`;

    window.addEventListener('load', () => {
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          console.log('ServiceWorker registration successful with scope: ', registration.scope);
          
          // Check for updates on page load
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version installed but waiting to be activated
                  document.dispatchEvent(new CustomEvent('appUpdateAvailable'));
                }
              });
            }
          });
          
        }).catch(error => {
          console.error('ServiceWorker registration failed: ', error);
        });

      // Check for updates every 30 minutes
      setInterval(() => {
        navigator.serviceWorker.ready.then(registration => {
          registration.update().catch(error => {
            console.error('Error checking for updates: ', error);
          });
        });
      }, 30 * 60 * 1000);
    });
  }
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}

// Function to check if a new version is available
export async function checkForUpdates() {
  // Skip checking for updates in preview environments
  if (isPreviewEnvironment()) {
    return { updateAvailable: false, previewEnvironment: true };
  }

  try {
    const response = await fetch('/version.json', { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error('Failed to fetch version info');
    }
    
    const data = await response.json();
    const currentVersion = APP_VERSION;
    const serverVersion = data.version;
    
    return {
      updateAvailable: currentVersion !== serverVersion,
      currentVersion,
      serverVersion
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
    return { updateAvailable: false, error };
  }
}

// Helper to force page refresh
export function forceRefresh() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      // First unregister to ensure clean state
      registration.unregister().then(() => {
        // Force reload from server, not from cache
        window.location.reload();
      });
    });
  } else {
    // If service worker is not available, just reload
    window.location.reload();
  }
}
