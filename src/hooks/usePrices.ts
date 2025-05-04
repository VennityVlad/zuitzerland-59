
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PriceData } from "@/types/booking";

export const usePrices = (date: string) => {
  return useQuery({
    queryKey: ["prices", date],
    queryFn: async () => {
      // Don't fetch if no date is provided
      if (!date) {
        return [];
      }

      const { data, error } = await supabase
        .from("prices")
        .select("*")
        .eq("date", date);

      if (error) {
        throw error;
      }

      return data as PriceData[];
    },
    // Only fetch when we have a valid date
    enabled: Boolean(date),
  });
};

// Add a new hook to fetch all prices at once
export const useAllPrices = () => {
  return useQuery({
    queryKey: ["allPrices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prices")
        .select("*");

      if (error) {
        throw error;
      }

      return data as PriceData[];
    },
  });
};
