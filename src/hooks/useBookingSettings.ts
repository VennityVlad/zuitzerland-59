
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BookingSettings {
  blockEnabled: boolean;
}

export const useBookingSettings = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookingSettings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'booking_block')
        .single();

      if (error) {
        console.error('Error fetching booking settings:', error);
        return { blockEnabled: true }; // Default to enabled if there's an error
      }

      return { 
        blockEnabled: data?.value?.enabled ?? true 
      };
    }
  });

  return {
    settings: data || { blockEnabled: true },
    isLoading,
    error
  };
};
