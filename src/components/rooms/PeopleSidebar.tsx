
import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, ChevronRight, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { TeamBadge } from "@/components/TeamBadge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  team_id: string | null;
  team: {
    id: string;
    name: string;
    color: string;
    logo_url: string | null;
  } | null;
};

type Team = {
  id: string;
  name: string;
  color: string;
  logo_url: string | null;
  member_count: number;
  profiles: Profile[];
};

const PeopleSidebar = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id, 
          full_name, 
          avatar_url, 
          email,
          team_id,
          team:teams(id, name, color, logo_url)
        `)
        .order('full_name');
      
      if (error) throw error;
      setProfiles(data || []);
      
      // Initially expand all teams
      const teamsExpanded: Record<string, boolean> = {};
      data?.forEach(profile => {
        if (profile.team_id) {
          teamsExpanded[profile.team_id] = true;
        }
      });
      setExpandedTeams({ 'no-team': true, ...teamsExpanded });
      
      setLoading(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error fetching profiles",
        description: error.message,
      });
      setLoading(false);
    }
  };

  const teams = useMemo(() => {
    const teamMap = new Map<string, Team>();
    // Initialize with "No Team"
    teamMap.set('no-team', {
      id: 'no-team',
      name: 'No Team',
      color: '#94a3b8', // slate-400
      logo_url: null,
      member_count: 0,
      profiles: []
    });
    
    // Group profiles by team
    profiles.forEach(profile => {
      if (profile.team_id && profile.team) {
        if (!teamMap.has(profile.team_id)) {
          teamMap.set(profile.team_id, {
            ...profile.team,
            member_count: 0,
            profiles: []
          });
        }
        const team = teamMap.get(profile.team_id)!;
        team.member_count++;
        team.profiles.push(profile);
      } else {
        const noTeam = teamMap.get('no-team')!;
        noTeam.member_count++;
        noTeam.profiles.push(profile);
      }
    });
    
    return Array.from(teamMap.values());
  }, [profiles]);

  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) {
      return teams;
    }
    
    return teams.map(team => {
      const filteredProfiles = team.profiles.filter(profile =>
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      return {
        ...team,
        profiles: filteredProfiles,
        member_count: filteredProfiles.length
      };
    }).filter(team => team.member_count > 0);
  }, [teams, searchQuery]);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const handleDragStart = (e: React.DragEvent, profile: Profile) => {
    e.dataTransfer.setData("profile", JSON.stringify(profile));
  };

  if (loading) {
    return (
      <Card className="w-full lg:w-[280px] p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-medium">People</div>
          <div className="text-xs text-muted-foreground animate-pulse">Loading...</div>
        </div>
        <div className="h-8 bg-muted animate-pulse rounded-md"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-6 w-1/2 bg-muted animate-pulse rounded-md"></div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-12 bg-muted animate-pulse rounded-md"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full lg:w-[280px] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="font-medium flex items-center gap-2">
          <User className="h-4 w-4" />
          People
        </div>
        <div className="text-xs text-muted-foreground">
          {profiles.length} total
        </div>
      </div>
      
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search people..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <div className="space-y-4 max-h-[500px] overflow-y-auto">
        {filteredTeams.map(team => (
          <div key={team.id} className="space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-between p-2 h-auto"
              onClick={() => toggleTeam(team.id)}
            >
              <div className="flex items-center gap-2">
                <TeamBadge team={team} size="sm" />
                <span className="font-medium">{team.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground">{team.member_count}</span>
                {expandedTeams[team.id] ? 
                  <ChevronDown className="h-3 w-3" /> : 
                  <ChevronRight className="h-3 w-3" />
                }
              </div>
            </Button>
            
            {expandedTeams[team.id] && (
              <div className="grid grid-cols-2 gap-2 pl-2">
                {team.profiles.map(profile => {
                  const bgColor = team.color || '#94a3b8';
                  return (
                    <div
                      key={profile.id}
                      className="p-2 border rounded-md bg-white hover:shadow-md transition-shadow"
                      draggable
                      onDragStart={(e) => handleDragStart(e, profile)}
                      style={{ borderLeft: `3px solid ${bgColor}` }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-muted">
                            {profile.full_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-xs font-medium text-center truncate w-full" title={profile.full_name || undefined}>
                          {profile.full_name || "Unnamed"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        
        {filteredTeams.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No people found matching "{searchQuery}"
          </div>
        )}
      </div>
    </Card>
  );
};

export default PeopleSidebar;
