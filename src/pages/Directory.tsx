
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { PageTitle } from "@/components/PageTitle";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { TeamBadge } from "@/components/TeamBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ContactRound, Search } from "lucide-react";

type Team = {
  id: string;
  name: string;
  logo_url: string | null;
  color?: string;
};

type ProfileWithTeam = {
  id: string;
  username: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  description: string | null;
  role: string | null;
  teams: Team | null;
};

const Directory = () => {
  const { user } = usePrivy();
  const [profiles, setProfiles] = useState<ProfileWithTeam[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<ProfileWithTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProfiles = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("profiles")
          .select("*, teams(*)")
          .eq("opt_in_directory", true)
          .order("username");
        
        if (error) throw error;
        
        if (data) {
          setProfiles(data as ProfileWithTeam[]);
          setFilteredProfiles(data as ProfileWithTeam[]);
        }
      } catch (error) {
        console.error("Error fetching directory profiles:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfiles();
  }, [user?.id]);
  
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProfiles(profiles);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = profiles.filter(profile => 
      (profile.username && profile.username.toLowerCase().includes(query)) ||
      (profile.full_name && profile.full_name.toLowerCase().includes(query)) ||
      (profile.email && profile.email.toLowerCase().includes(query)) ||
      (profile.description && profile.description.toLowerCase().includes(query)) ||
      (profile.teams?.name && profile.teams.name.toLowerCase().includes(query))
    );
    
    setFilteredProfiles(filtered);
  }, [searchQuery, profiles]);
  
  return (
    <div className="flex flex-col h-full">
      <PageTitle 
        title="Resident Directory" 
        description="Connect with other Zuitzerland residents"
      />
      
      <div className="py-8 px-4 flex-grow">
        <div className="container max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="relative mb-6">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search by name, email, team, or description..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {!isLoading && filteredProfiles.length === 0 && (
              <Card className="bg-gray-50">
                <CardContent className="p-6 text-center">
                  <ContactRound className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <h3 className="text-lg font-medium text-gray-700">No residents found</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {searchQuery ? "Try adjusting your search" : "No residents have opted in to the directory yet"}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-4">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-3 w-1/2" />
                          <Skeleton className="h-3 w-1/4" />
                        </div>
                      </div>
                      <Skeleton className="h-12 w-full mt-4" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((profile) => (
                <Card key={profile.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-16 w-16 border">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>
                          {profile.username?.charAt(0) || profile.email?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{profile.full_name || profile.username}</h3>
                        <p className="text-sm text-gray-500">{profile.email}</p>
                        {profile.role && (
                          <p className="text-xs text-primary font-medium capitalize mt-1">
                            {profile.role.replace(/-/g, ' ')}
                          </p>
                        )}
                        {profile.teams && (
                          <div className="mt-2">
                            <TeamBadge team={profile.teams} />
                          </div>
                        )}
                      </div>
                    </div>
                    {profile.description && (
                      <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                        {profile.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Directory;
