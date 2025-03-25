
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  team: {
    id: string;
    name: string;
    logo_url?: string;
  };
  className?: string;
}

export const TeamBadge = ({ team, className }: TeamBadgeProps) => {
  if (!team) return null;
  
  // Generate a deterministic color based on the team name
  const getColorClass = (name: string) => {
    const hash = name.split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const hue = Math.abs(hash % 360);
    
    // Pick one of several predefined gradient styles based on the hash
    const gradients = [
      'from-indigo-500 to-purple-500',
      'from-blue-500 to-teal-500',
      'from-green-500 to-emerald-500',
      'from-amber-500 to-orange-500',
      'from-rose-500 to-pink-500',
      'from-violet-500 to-purple-500',
    ];
    
    return gradients[Math.abs(hash) % gradients.length];
  };
  
  return (
    <Badge 
      className={cn(
        "px-3 py-1 text-white bg-gradient-to-r transition-all hover:shadow-md flex items-center gap-1.5",
        getColorClass(team.name),
        className
      )}
    >
      <Users className="h-3.5 w-3.5" />
      <span>{team.name}</span>
    </Badge>
  );
};
