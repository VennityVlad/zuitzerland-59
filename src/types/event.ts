
import { Profile } from "@/integrations/supabase/types";

export interface EventWithProfile {
  id: string;
  title: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_all_day: boolean;
  location_id?: string;
  location_text?: string;
  created_by: string;
  color?: string;
  profiles?: Profile;
  // Add other fields as needed
}

export interface CoHost {
  id: string;
  username: string;
  avatar_url?: string | null;
}

export interface CoHostRecord {
  [eventId: string]: CoHost[];
}
