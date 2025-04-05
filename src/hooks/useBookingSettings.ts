
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BookingSettings {
  blockEnabled: boolean;
}

export const useBookingSettings = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookingSettings'],
    queryFn: async () => {
      // Using the more generic approach with string parameters
      // to avoid TypeScript errors with the generated types
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'booking_block')
        .single();

      if (error) {
        console.error('Error fetching booking settings:', error);
        return { blockEnabled: true }; // Default to enabled if there's an error
      }

      // Safely parse the value field which could be a JSON object or string
      let enabled = true; // Default value
      try {
        // Check if data.value is a string that needs parsing
        if (typeof data.value === 'string') {
          const parsed = JSON.parse(data.value);
          enabled = parsed.enabled ?? true;
        } 
        // Check if data.value is already an object
        else if (data.value && typeof data.value === 'object') {
          // Check if it's an array (which doesn't have .enabled property)
          if (Array.isArray(data.value)) {
            enabled = true; // Default for array case
          } else {
            // It's an object, but we need to check if it has 'enabled' property
            // Use type assertion to tell TypeScript this is a record with string keys
            const valueObj = data.value as Record<string, any>;
            enabled = valueObj.enabled ?? true;
          }
        }
      } catch (e) {
        console.error('Error parsing booking settings:', e);
      }

      return { 
        blockEnabled: enabled
      };
    }
  });

  return {
    settings: data || { blockEnabled: true },
    isLoading,
    error
  };
};
