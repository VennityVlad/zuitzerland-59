
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "lucide-react";

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
    <div className="flex items-center -space-x-2 mt-2">
      {profilesToShow.map((profile, idx) => {
        // Check if the profile has private RSVP visibility settings
        const isPrivate = profile.privacy_settings?.event_rsvp_visibility === 'private';

        return (
          <Avatar
            key={profile.id}
            className={`border-2 border-white shadow-sm h-8 w-8 ${idx === 0 ? "" : ""}`}
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
  );
}
