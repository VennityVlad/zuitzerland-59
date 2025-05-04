
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface RSVPProfile {
  id: string;
  username: string | null;
  avatar_url?: string | null;
  privacy_settings?: {
    event_rsvp_visibility?: 'private' | 'public';
  } | null;
}

interface EventRSVPAvatarsProps {
  profiles: RSVPProfile[];
  maxVisible?: number;
}

export function EventRSVPAvatars({ profiles, maxVisible = 5 }: EventRSVPAvatarsProps) {
  const profilesToShow = profiles.slice(0, maxVisible);
  const othersCount = profiles.length - profilesToShow.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="flex items-center -space-x-2 mt-2 cursor-pointer group">
          {profilesToShow.map((profile, idx) => {
            // Check if the profile has private RSVP visibility settings
            const isPrivate = profile.privacy_settings?.event_rsvp_visibility === 'private';

            return (
              <Avatar
                key={profile.id}
                className={`border-2 border-white shadow-sm h-8 w-8 transition-transform group-hover:scale-105 ${idx === 0 ? "" : ""}`}
                style={{ zIndex: 10 - idx }}
              >
                {!isPrivate && profile.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.username || "User"} />
                ) : (
                  <AvatarFallback className="bg-gray-200">
                    <User className="h-4 w-4 text-gray-500" />
                  </AvatarFallback>
                )}
              </Avatar>
            );
          })}
          {othersCount > 0 && (
            <span className="ml-2 text-xs text-gray-500 font-medium">
              +{othersCount} more
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <h4 className="text-sm font-medium mb-2">Attendees ({profiles.length})</h4>
        <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2">
          {profiles.map((profile) => {
            const isPrivate = profile.privacy_settings?.event_rsvp_visibility === 'private';
            return (
              <div key={profile.id} className="flex items-center gap-2 py-1">
                <Avatar className="h-8 w-8">
                  {!isPrivate && profile.avatar_url ? (
                    <AvatarImage src={profile.avatar_url} alt={profile.username || "User"} />
                  ) : (
                    <AvatarFallback className="bg-gray-200">
                      <User className="h-4 w-4 text-gray-500" />
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-sm truncate">
                  {isPrivate ? "Anonymous User" : profile.username || "Anonymous User"}
                </span>
              </div>
            );
          })}
          {profiles.length === 0 && (
            <p className="text-sm text-gray-500">No attendees yet</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
