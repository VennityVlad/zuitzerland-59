
import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  avatar_url?: string | null;
  username?: string | null;
  email?: string | null;
}

export const UserAvatar = () => {
  const { user, logout } = usePrivy();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, username, email')
          .eq('privy_id', user.id)
          .maybeSingle();
          
        if (error) throw error;
        
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };
    
    fetchUserProfile();
  }, [user?.id]);
  
  // Get initials for the avatar fallback
  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    
    if (user?.email?.address) {
      return user.email.address.substring(0, 2).toUpperCase();
    }
    
    return "U";
  };
  
  const navigateToProfile = () => {
    navigate('/profile');
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
          <AvatarFallback className="bg-primary/10 text-primary">
            {getInitials()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={navigateToProfile}>
          <User className="h-4 w-4 mr-2" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => logout()} className="text-red-500 hover:text-red-700">
          <LogOut className="h-4 w-4 mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
