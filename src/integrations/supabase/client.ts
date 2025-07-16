
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { config, validateConfig } from '@/lib/config';

// Validate configuration on initialization
validateConfig();

const SUPABASE_URL = config.supabase.url;
const SUPABASE_PUBLISHABLE_KEY = config.supabase.anonKey;

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

// Create client with debug logging enabled in development mode
const options: { 
  auth: { 
    persistSession: boolean; 
    autoRefreshToken: boolean; 
  };
  global?: {
    fetch: typeof fetch;
  }
} = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
};

// Add debug logging in development mode
if (process.env.NODE_ENV === 'development') {
  options.global = { 
    fetch: (url: RequestInfo | URL, init?: RequestInit) => {
      console.log('[Supabase Debug] API call:', url);
      return fetch(url, init);
    }
  };
}

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  options
);

// DEBUG: Log client initialization (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('[Supabase Client] Initialized with URL:', SUPABASE_URL);
}

// Add a function to check if the client is properly initialized
// This can be useful for debugging
export const checkSupabaseClient = () => {
  console.log('[Supabase Client Check] Client initialized:', !!supabase);
  return supabase;
};
