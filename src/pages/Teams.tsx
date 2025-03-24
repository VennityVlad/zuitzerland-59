
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import CreateTeamDialog from "@/components/team-management/CreateTeamDialog";
import TeamCard from "@/components/team-management/TeamCard";

type Team = {
  id: string;
  name: string;
  description: string | null;
  logo_url: string | null;
};

const Teams = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if user is admin - using useCallback to prevent recreating this function
  const checkIfAdmin = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('privy_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data?.role !== 'admin') {
        toast({
          title: "Access denied",
          description: "You need admin permissions to access this page",
          variant: "destructive",
        });
        navigate('/');
      } else {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      toast({
        title: "Error",
        description: "Failed to verify permissions",
        variant: "destructive",
      });
      navigate('/');
    }
  }, [user?.id, navigate, toast]);

  // Fetch teams with useCallback to prevent recreation on each render
  const fetchTeams = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setTeams(data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAdmin, toast]);

  // Check admin status only when user changes
  useEffect(() => {
    checkIfAdmin();
  }, [checkIfAdmin]);

  // Fetch teams only when isAdmin changes
  useEffect(() => {
    if (isAdmin) {
      fetchTeams();
    }
  }, [isAdmin, fetchTeams]);

  // Filter teams based on search term
  useEffect(() => {
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      const results = teams.filter(team => 
        (team.name.toLowerCase().includes(lowercaseSearch) || false) ||
        (team.description?.toLowerCase().includes(lowercaseSearch) || false)
      );
      setFilteredTeams(results);
    } else {
      setFilteredTeams(teams);
    }
  }, [searchTerm, teams]);

  const handleRefreshTeams = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    await fetchTeams();
  };

  // Debounce search to prevent excessive filtering on each keystroke
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <PageTitle title="Team Management" />
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Team
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search teams by name or description"
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshTeams}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No teams found</p>
              {searchTerm && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchTerm("")}
                >
                  Clear Search
                </Button>
              )}
              {teams.length === 0 && !searchTerm && (
                <div className="mt-4">
                  <p className="text-gray-500 mb-4">Get started by creating your first team</p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Team
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {filteredTeams.map((team) => (
                <TeamCard 
                  key={team.id} 
                  team={team} 
                  onRefresh={handleRefreshTeams}
                />
              ))}
            </div>
          )}
        </>
      )}

      <CreateTeamDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        onTeamCreated={handleRefreshTeams}
      />
    </div>
  );
};

export default Teams;
