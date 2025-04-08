import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Team = {
  id: string;
  name: string;
  color: string;
  logo_url: string | null;
};

type TeamBadgeProps = {
  team: Team;
  size?: "sm" | "md";
};

export const TeamBadge: React.FC<TeamBadgeProps> = ({ team, size = "md" }) => {
  const badgeSizeClass = size === "sm" ? "h-5 w-5" : "h-6 w-6";
  const avatarSizeClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const textSizeClass = size === "sm" ? "text-[0.6rem]" : "text-xs";

  return (
    <div className={`flex items-center justify-center rounded-full ${badgeSizeClass}`} style={{ backgroundColor: team.color, width: badgeSizeClass, height: badgeSizeClass }}>
      {team.logo_url ? (
        <img src={team.logo_url} alt={team.name} className={`rounded-full ${avatarSizeClass}`} style={{ width: avatarSizeClass, height: avatarSizeClass }} />
      ) : (
        <Avatar className={avatarSizeClass}>
          <AvatarImage src="" />
          <AvatarFallback className={textSizeClass}>
            {team.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
};
