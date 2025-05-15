
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Add a consistent query helper for RSVP data - modified to not filter by privacy settings
export const getRsvpProfilesQuery = (supabase: any, eventId: string) => {
  return supabase
    .from("event_rsvps")
    .select(`
      profile_id,
      profiles:profiles(id, username, avatar_url)
    `)
    .eq("event_id", eventId);
};
