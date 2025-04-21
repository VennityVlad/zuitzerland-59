
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface RSVPProfile {
  id: string;
  username: string | null;
  avatar_url?: string | null;
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
      {profilesToShow.map((profile, idx) => (
        <Avatar
          key={profile.id}
          className={`border-2 border-white shadow-sm h-8 w-8 ${idx === 0 ? "" : ""}`}
          style={{ zIndex: 10 - idx }}
        >
          {profile.avatar_url ? (
            <AvatarImage src={profile.avatar_url} alt={profile.username || "User"} />
          ) : (
            <AvatarFallback>
              {(profile.username?.[0] || "U").toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
      ))}
      {othersCount > 0 && (
        <span className="ml-2 text-xs text-gray-500 font-medium">
          +{othersCount} more
        </span>
      )}
    </div>
  );
}
