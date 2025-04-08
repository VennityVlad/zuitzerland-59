
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
import HousingPreferencesFilter, { PreferenceFilters } from "./HousingPreferencesFilter";

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  team_id: string | null;
  housing_preferences: Record<string, any> | null;
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
  const [preferenceFilters, setPreferenceFilters] = useState<PreferenceFilters>({});
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
          housing_preferences,
          team:teams(id, name, logo_url)
        `)
        .order('full_name');
      
      if (error) throw error;
      
      // Assign default color for teams since the column doesn't exist in DB
      const profilesWithTeamColors = data?.map(profile => {
        if (profile.team) {
          // Generate a consistent color based on team ID
          const color = generateTeamColor(profile.team.id);
          return {
            ...profile,
            team: {
              ...profile.team,
              color: color
            }
          };
        }
        return profile;
      }) as Profile[];
      
      setProfiles(profilesWithTeamColors || []);
      
      // Initially expand all teams
      const teamsExpanded: Record<string, boolean> = {};
      profilesWithTeamColors?.forEach(profile => {
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

  // Function to generate a consistent color based on team ID
  const generateTeamColor = (teamId: string): string => {
    // Simple hash function to generate a consistent color
    let hash = 0;
    for (let i = 0; i < teamId.length; i++) {
      hash = teamId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Convert to hex color
    const colors = [
      '#4F46E5', // indigo-600
      '#EC4899', // pink-600
      '#10B981', // emerald-600
      '#F59E0B', // amber-500
      '#3B82F6', // blue-500
      '#8B5CF6', // violet-500
      '#EF4444', // red-500
      '#14B8A6', // teal-500
      '#F97316', // orange-500
      '#6366F1', // indigo-500
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  // Filter profiles by housing preferences
  const filterProfilesByPreferences = (profilesArray: Profile[]): Profile[] => {
    if (!preferenceFilters || Object.keys(preferenceFilters).length === 0) {
      return profilesArray;
    }

    return profilesArray.filter(profile => {
      if (!profile.housing_preferences) return false;
      
      // Check if profile matches all filter categories
      return Object.entries(preferenceFilters).every(([category, selectedValues]) => {
        const profileValue = profile.housing_preferences[category];
        
        // If the profile doesn't have this preference category, it doesn't match
        if (!profileValue) return false;
        
        // Check if any of the selected values match the profile's value
        // Handle both array and string values
        if (Array.isArray(profileValue)) {
          return selectedValues.some(value => profileValue.includes(value));
        } else {
          return selectedValues.includes(profileValue);
        }
      });
    });
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
    // First filter by search query
    let searchFilteredTeams = teams;
    
    if (searchQuery.trim()) {
      searchFilteredTeams = teams.map(team => {
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
    }
    
    // Then filter by preferences
    return searchFilteredTeams.map(team => {
      const preferenceFilteredProfiles = filterProfilesByPreferences(team.profiles);
      return {
        ...team,
        profiles: preferenceFilteredProfiles,
        member_count: preferenceFilteredProfiles.length
      };
    }).filter(team => team.member_count > 0);
  }, [teams, searchQuery, preferenceFilters]);

  const toggleTeam = (teamId: string) => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const handleDragStart = (e: React.DragEvent, profile: Profile) => {
    e.dataTransfer.setData("profile", JSON.stringify(profile));
  };

  const handleFilterChange = (filters: PreferenceFilters) => {
    setPreferenceFilters(filters);
  };

  // Count total profiles
  const totalVisibleProfiles = filteredTeams.reduce(
    (sum, team) => sum + team.member_count, 0
  );
  
  const totalProfiles = profiles.length;

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
          {totalVisibleProfiles} of {totalProfiles}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <HousingPreferencesFilter onFilterChange={handleFilterChange} />
        </div>
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
            No people found matching filters
          </div>
        )}
      </div>
    </Card>
  );
};

export default PeopleSidebar;
