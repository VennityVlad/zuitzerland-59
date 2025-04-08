
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TeamBadgeProps {
  team: {
    id: string;
    name: string;
    color?: string;
    logo_url?: string | null;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const TeamBadge = ({ team, className, size = "md" }: TeamBadgeProps) => {
  if (!team) return null;
  
  // Generate a deterministic color based on the team name if not provided
  const teamColor = team.color || getColorClass(team.name);
  
  // Size variations for the badge
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm"
  };
  
  // Avatar size variations
  const avatarSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5"
  };
  
  // Icon size variations
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4"
  };
  
  return (
    <Badge 
      className={cn(
        "text-white bg-gradient-to-r transition-all hover:shadow-md flex items-center gap-1.5",
        sizeClasses[size],
        className
      )}
      style={{
        background: teamColor,
        // Add a gradient overlay for better aesthetics
        backgroundImage: `linear-gradient(to right, ${teamColor}, ${adjustColor(teamColor, 30)})`
      }}
    >
      {team.logo_url ? (
        <Avatar className={cn("border border-white/30", avatarSizes[size])}>
          <AvatarImage src={team.logo_url} alt={team.name} />
          <AvatarFallback className="text-[8px]">
            {team.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
      ) : (
        <Users className={iconSizes[size]} />
      )}
      <span>{team.name}</span>
    </Badge>
  );
};

// Function to generate a color based on the team name
const getColorClass = (name: string) => {
  const hash = name.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash % 360);
  
  // Generate HSL color with high saturation and medium lightness
  return `hsl(${hue}, 70%, 45%)`;
};

// Function to adjust a color's lightness
const adjustColor = (color: string, amount: number) => {
  // This is a simplification - works when color is in hex format
  // For more accurate color manipulation, consider using a color library
  if (color.startsWith('#')) {
    // Convert hex to RGB
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    
    // Adjust RGB values
    const adjustR = Math.min(255, Math.max(0, r + amount));
    const adjustG = Math.min(255, Math.max(0, g + amount));
    const adjustB = Math.min(255, Math.max(0, b + amount));
    
    // Convert back to hex
    return `#${adjustR.toString(16).padStart(2, '0')}${adjustG.toString(16).padStart(2, '0')}${adjustB.toString(16).padStart(2, '0')}`;
  }
  
  // For non-hex colors, return the original color
  return color;
};
