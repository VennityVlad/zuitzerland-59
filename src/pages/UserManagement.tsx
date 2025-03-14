
import { useState, useEffect } from "react";
import { PageTitle } from "@/components/PageTitle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Pencil } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";
import { AddProfileDialog } from "@/components/profiles/AddProfileDialog";

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
  description: string | null;
  created_at: string;
}

const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const { roles } = useSupabaseAuth();
  const navigate = useNavigate();

  // Check if user is admin, redirect if not
  useEffect(() => {
    if (!roles.admin) {
      toast({
        title: "Access Denied",
        description: "You need admin privileges to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [roles, navigate, toast]);

  // Fetch profiles
  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        setProfiles(data || []);
        setFilteredProfiles(data || []);
      } catch (error) {
        console.error("Error fetching profiles:", error);
        toast({
          title: "Error",
          description: "Failed to load user profiles",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfiles();
  }, [toast]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredProfiles(profiles);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = profiles.filter(
        (profile) =>
          (profile.username && profile.username.toLowerCase().includes(query)) ||
          (profile.email && profile.email.toLowerCase().includes(query)) ||
          (profile.role && profile.role.toLowerCase().includes(query))
      );
      setFilteredProfiles(filtered);
    }
  }, [searchQuery, profiles]);

  return (
    <div className="flex flex-col h-full">
      <PageTitle 
        title="User Management" 
        description="Manage user profiles" 
      />

      <div className="py-8 px-4 flex-grow">
        <div className="container max-w-7xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add New User
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No profiles found</h3>
              <p className="text-gray-500">
                {searchQuery.trim() !== ""
                  ? "Try adjusting your search query"
                  : "Start by adding a new user profile"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProfiles.map((profile) => (
                <Card key={profile.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span>{profile.username || "Anonymous User"}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/profile-edit/${profile.id}`)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </CardTitle>
                    <p className="text-sm font-medium text-primary">
                      {profile.role ? profile.role.replace(/-/g, " ") : "No role assigned"}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <p className="text-sm text-gray-500 truncate">
                      {profile.email || "No email"}
                    </p>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {profile.description || "No description provided"}
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <p className="text-xs text-gray-400">
                      Created: {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddProfileDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          // Refresh profiles list after adding a new profile
          supabase
            .from("profiles")
            .select("*")
            .order("created_at", { ascending: false })
            .then(({ data, error }) => {
              if (!error && data) {
                setProfiles(data);
                setFilteredProfiles(data);
              }
            });
        }}
      />
    </div>
  );
};

export default UserManagement;
