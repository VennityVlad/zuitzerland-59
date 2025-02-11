
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { PriceData } from "@/types/booking";

export const usePrices = (date: string) => {
  return useQuery({
    queryKey: ["prices", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prices")
        .select("*")
        .eq("date", date);

      if (error) {
        throw error;
      }

      return data as PriceData[];
    },
  });
};
