
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Updated RSVP query helper to be more flexible and efficient
// This version handles all RSVP data cases uniformly
export const getRsvpProfilesQuery = (supabase: any, eventId: string) => {
  return supabase
    .from("event_rsvps")
    .select(`
      profile_id,
      profiles:profiles(id, username, avatar_url)
    `)
    .eq("event_id", eventId);
};

// Add new helper to get events a user has RSVP'd to
export const getUserRsvpEventsQuery = (supabase: any, profileId: string) => {
  return supabase
    .from("event_rsvps")
    .select(`
      event_id,
      events:events(*)
    `)
    .eq("profile_id", profileId);
};

