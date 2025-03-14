
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Filter } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PageTitle } from "@/components/PageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import InviteUserDialog from "@/components/user-management/InviteUserDialog";
import UserCard from "@/components/user-management/UserCard";
import UserFilters from "@/components/user-management/UserFilters";

type Profile = {
  id: string;
  username: string;
  email: string;
  role: "admin" | "co-designer" | "co-curator" | null;
  avatar_url: string | null;
  full_name: string | null;
};

const UserManagement = () => {
  const { user } = usePrivy();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
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

  // Fetch profiles with useCallback to prevent recreation on each render
  const fetchProfiles = useCallback(async () => {
    if (!isAdmin) return;
    
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, role, avatar_url, full_name')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load user profiles",
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

  // Fetch profiles only when isAdmin changes
  useEffect(() => {
    if (isAdmin) {
      fetchProfiles();
    }
  }, [isAdmin, fetchProfiles]);

  // Filter profiles based on search term and selected role
  // Use useEffect with memo dependencies to prevent unnecessary recalculations
  useEffect(() => {
    let results = [...profiles];
    
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      results = results.filter(profile => 
        (profile.username?.toLowerCase().includes(lowercaseSearch) || false) ||
        (profile.email?.toLowerCase().includes(lowercaseSearch) || false) ||
        (profile.full_name?.toLowerCase().includes(lowercaseSearch) || false)
      );
    }
    
    if (selectedRole) {
      results = results.filter(profile => profile.role === selectedRole);
    }
    
    setFilteredProfiles(results);
  }, [searchTerm, selectedRole, profiles]);

  const handleRefreshProfiles = async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    await fetchProfiles();
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
        <PageTitle title="User Management" />
        <Button onClick={() => setShowInviteDialog(true)}>
          <Plus className="mr-2 h-4 w-4" /> Invite User
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search users by name, email, or username"
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="mr-2 h-4 w-4" /> 
            Filters
            {selectedRole && <Badge className="ml-2 bg-primary">{selectedRole}</Badge>}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleRefreshProfiles}
            disabled={isRefreshing}
          >
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </div>
      </div>

      {showFilters && (
        <UserFilters 
          selectedRole={selectedRole} 
          onRoleChange={setSelectedRole} 
          onClearFilters={() => setSelectedRole(null)}
        />
      )}

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
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-lg text-gray-500">No users found matching your criteria</p>
              {(searchTerm || selectedRole) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedRole(null);
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {filteredProfiles.map((profile) => (
                <UserCard 
                  key={profile.id} 
                  profile={profile} 
                  onRefresh={handleRefreshProfiles}
                />
              ))}
            </div>
          )}
        </>
      )}

      <InviteUserDialog 
        open={showInviteDialog} 
        onOpenChange={setShowInviteDialog}
        onUserInvited={handleRefreshProfiles}
      />
    </div>
  );
};

export default UserManagement;
