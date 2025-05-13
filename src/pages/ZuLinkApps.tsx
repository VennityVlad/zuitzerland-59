
import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query"; // Added for react-query
import { usePrivy } from "@privy-io/react-auth"; // Added for Privy user
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext"; // Added for Supabase auth user
import { useSupabaseJwt } from "@/components/SupabaseJwtProvider";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { PageTitle } from "@/components/PageTitle";
import { CreateProjectIdeaSheet } from "@/components/zulink/CreateProjectIdeaSheet";
import { ProjectIdeaCard } from "@/components/zulink/ProjectIdeaCard";
import { AppsFilter } from "@/components/zulink/AppsFilter";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
// Supabase client might be needed if authenticatedSupabase is not used directly in queryFn
// import { supabase } from "@/integrations/supabase/client"; 

type ProjectIdeaData = Tables<'zulink_projects'>;

export default function ZuLinkProjects() {
  const [projects, setProjects] = useState<ProjectIdeaData[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true); // Renamed for clarity
  const [filter, setFilter] = useState("all");
  
  const { authenticatedSupabase, isAuthenticated } = useSupabaseJwt();
  const { toast } = useToast();
  const { user: privyUser } = usePrivy();
  const { user: supabaseAuthUser } = useSupabaseAuth();

  // This will be auth.users.id from either Privy or Supabase Auth
  const authUserId = privyUser?.id || supabaseAuthUser?.id;

  // Fetch user profile (specifically profile.id) using React Query
  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ["zulinkUserProfile", authUserId, authenticatedSupabase],
    queryFn: async () => {
      if (!authUserId || !authenticatedSupabase) {
        console.log("ZuLinkApps: No authUserId or authenticatedSupabase, skipping profile fetch.");
        return null;
      }
      console.log("ZuLinkApps: Fetching profile for authUserId:", authUserId);
      
      // Fix: Query by privy_id instead of auth_user_id when dealing with Privy users
      const queryField = privyUser?.id ? 'privy_id' : 'auth_user_id';
      
      const { data: profileData, error } = await authenticatedSupabase
        .from('profiles')
        .select('id') // We need the profile.id
        .eq(queryField, authUserId) // Query by the appropriate field
        .maybeSingle();

      if (error) {
        console.error("Error fetching user profile for ZuLink:", error.message);
        // It's important to handle cases where a profile might not exist yet
        // or if there's a genuine error. Returning null is one way.
        if (error.code === 'PGRST116') { // PGRST116: "Fetched result not found" (0 rows)
             console.warn(`ZuLinkApps: No profile found for ${queryField} ${authUserId}. This might be expected if the profile is created later.`);
        } else {
             toast({
                title: "Error loading user profile",
                description: "Could not load your profile information. Some features might be unavailable.",
                variant: "destructive",
             });
        }
        return null;
      }
      console.log("ZuLinkApps: Profile fetched:", profileData);
      return profileData;
    },
    enabled: !!authUserId && !!authenticatedSupabase, // Only run if authUserId and supabase client are available
    retry: 1, // Retry once on failure
  });

  const userProfileId = userProfile?.id; // This is the profiles.id

  const { isAdmin } = useAdminStatus(authUserId);

  const fetchProjects = async () => {
    if (!authenticatedSupabase) return;
    
    setLoadingProjects(true);
    try {
      const { data, error } = await authenticatedSupabase
        .from('zulink_projects')
        .select(`
          *,
          profiles (
            full_name,
            username,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({
        title: "Error loading projects",
        description: (error as Error).message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    // Fetch projects if authenticated and Supabase client is ready
    // isAuthenticated from useSupabaseJwt() indicates if the Supabase session is set up
    if (isAuthenticated && authenticatedSupabase) {
      fetchProjects();
    }
  }, [isAuthenticated, authenticatedSupabase]); // Removed toast dependency, fetchProjects has its own

  const filteredProjects = useMemo(() => {
    // Ensure userProfileId is used for filtering 'my' submissions
    // and for non-admin 'all' view to show user's own pending/rejected items.
    if (!projects) return [];

    switch (filter) {
      case "pending":
        return projects.filter(project => project.status === "pending");
      case "my":
        // Only filter by 'my' if userProfileId is available
        return userProfileId ? projects.filter(project => project.profile_id === userProfileId) : [];
      default: // "all"
        return isAdmin 
          ? projects 
          : projects.filter(project => 
              project.status === "approved" || 
              project.status === "implemented" || 
              (userProfileId && project.profile_id === userProfileId) // Show user's own regardless of status
            );
    }
  }, [projects, filter, isAdmin, userProfileId]);

  const pendingProjectsCount = useMemo(() => {
    return projects.filter(project => project.status === "pending").length;
  }, [projects]);

  const myProjectsCount = useMemo(() => {
    if (!userProfileId) return 0;
    return projects.filter(project => project.profile_id === userProfileId).length;
  }, [projects, userProfileId]);

  const allProjectsCount = useMemo(() => {
    // For non-logged in or profile not loaded, show count of public projects
    if (!userProfileId && !isAdmin) {
        return projects.filter(p => p.status === "approved" || p.status === "implemented").length;
    }
    return isAdmin 
        ? projects.length 
        : projects.filter(p => 
            p.status === "approved" || 
            p.status === "implemented" || 
            (userProfileId && p.profile_id === userProfileId)
          ).length;
  }, [projects, isAdmin, userProfileId]);


  if (!isAuthenticated) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Please sign in to access ZuLink Projects & Ideas</h2>
      </div>
    );
  }
  
  // Combined loading state for initial page readiness
  const pageLoading = loadingProjects || (!!authUserId && profileLoading && !userProfileId);

  return (
    <div>
      <PageTitle 
        title="ZuLink Projects & Ideas" 
        description="Share and discover projects and ideas for Zuitzerland"
        icon={<Lightbulb size={24} />}
        actions={
          <CreateProjectIdeaSheet 
            onProjectCreated={fetchProjects}
            userId={userProfileId} // Pass the profile.id from the fetched profile
          />
        }
      />

      <div className="container py-6">
        <AppsFilter 
          onFilterChange={setFilter}
          filter={filter}
          isAdmin={isAdmin}
          pendingProjectsCount={pendingProjectsCount}
          myProjectsCount={myProjectsCount}
          allProjectsCount={allProjectsCount}
        />

        {pageLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            <span className="ml-2">Loading projects and user data...</span>
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectIdeaCard
                key={project.id}
                {...project} 
                isAdmin={isAdmin}
                currentUserId={userProfileId} // Pass profile.id as currentUserId
                onStatusUpdate={fetchProjects}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              {filter === "pending" ? "No pending submissions found" : 
               filter === "my" ? (userProfileId ? "You haven't submitted any projects or ideas yet" : "Loading your submissions...") : 
               "No projects or ideas available"}
            </h3>
            <p className="text-gray-400">
              {filter === "my" && userProfileId ? "Click 'Submit Project or Idea' to add your first one" : 
               "Check back later for new submissions or share your own!"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
