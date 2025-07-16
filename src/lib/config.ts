// Configuration for the application
// This file should be customized for your specific deployment

export const config = {
  // Supabase Configuration
  // Replace these with your own Supabase project credentials
  supabase: {
    url: "https://your-project-ref.supabase.co", // Replace with your project URL
    anonKey: "your-anon-key-here", // Replace with your anon key
  },
  
  // Application Settings
  app: {
    name: "ZuPass Community Platform",
    description: "A community platform for events, bookings, and collaboration",
  },
  
  // Feature Flags
  features: {
    // These can be toggled based on your deployment needs
    enableMeerkatIntegration: true,
    enablePrivyAuth: true,
    enableFileUploads: true,
    enableDirectoryFeature: true,
    enableOnboardingFlow: true,
  },
  
  // External Service Configuration
  // These should be configured via Supabase secrets in production
  services: {
    // Privy configuration (fetched via edge function)
    privy: {
      // App ID is fetched dynamically via get-secret edge function
      isPreview: false, // Set to true for development/preview environments
    },
    
    // Meerkat integration settings
    meerkat: {
      enabled: true,
      // Conference ID and auth secret are stored in Supabase secrets
    },
    
    // Request Finance integration
    requestFinance: {
      enabled: true,
      // API keys are stored in Supabase secrets
    },
  },
} as const;

// Environment detection
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';

// Helper function to get configuration values
export const getConfig = () => config;

// Validation function to ensure required config is present
export const validateConfig = () => {
  const errors: string[] = [];
  
  if (!config.supabase.url || config.supabase.url.includes('your-project-ref')) {
    errors.push('Supabase URL must be configured');
  }
  
  if (!config.supabase.anonKey || config.supabase.anonKey.includes('your-anon-key')) {
    errors.push('Supabase anon key must be configured');
  }
  
  if (errors.length > 0) {
    throw new Error(`Configuration errors: ${errors.join(', ')}`);
  }
};