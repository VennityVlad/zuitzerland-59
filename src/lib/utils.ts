
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

// New function to load RSVPs for multiple events efficiently
export const getMultipleEventRsvpsQuery = (supabase: any, eventIds: string[]) => {
  if (!eventIds || eventIds.length === 0) return null;
  
  return supabase
    .from("event_rsvps")
    .select(`
      event_id,
      profile_id,
      profiles:profiles(id, username, avatar_url)
    `)
    .in("event_id", eventIds);
};
