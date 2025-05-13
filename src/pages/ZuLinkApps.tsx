import { useState, useEffect, useMemo } from "react";
import { useSupabaseJwt } from "@/components/SupabaseJwtProvider";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { PageTitle } from "@/components/PageTitle";
import { CreateProjectIdeaSheet } from "@/components/zulink/CreateProjectIdeaSheet";
import { ProjectIdeaCard } from "@/components/zulink/ProjectIdeaCard";
import { AppsFilter } from "@/components/zulink/AppsFilter";
import { useToast } from "@/hooks/use-toast";
import { Lightbulb, Loader2 } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";

type ProjectIdeaData = Tables<'zulink_projects'>;

export default function ZuLinkProjects() {
  const [projects, setProjects] = useState<ProjectIdeaData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { authenticatedSupabase, isAuthenticated } = useSupabaseJwt();
  const { toast } = useToast();
  
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [userProfileId, setUserProfileId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (authenticatedSupabase) {
      const fetchUserSession = async () => {
        const { data: { session } } = await authenticatedSupabase.auth.getSession();
        if (session?.user?.id) {
            setUserId(session.user.id); // This is auth.users.id
            // Fetch profile_id from profiles table based on auth.users.id
            const { data: profile, error: profileError } = await authenticatedSupabase
                .from('profiles')
                .select('id')
                .eq('auth_user_id', session.user.id)
                .single();
            if (profileError) console.error("Error fetching profile id:", profileError);
            if (profile) setUserProfileId(profile.id);
        }
      };
      fetchUserSession();
    }
  }, [authenticatedSupabase]);
  
  const { isAdmin } = useAdminStatus(userId); // Admin status based on auth.users.id
  // const { hasPaidInvoice, isLoading: isInvoiceLoading } = usePaidInvoiceStatus(userId); // Keep if needed for other features or reinstate for submissions

  const fetchProjects = async () => {
    if (!authenticatedSupabase) return;
    
    setLoading(true);
    try {
      // Fetch projects and related profile information (username as submitter_name)
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
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    }
  }, [isAuthenticated, authenticatedSupabase]);

  const filteredProjects = useMemo(() => {
    if (!projects || !userProfileId) return []; // Use userProfileId for filtering 'my' submissions

    switch (filter) {
      case "pending":
        return projects.filter(project => project.status === "pending");
      case "my":
        return projects.filter(project => project.profile_id === userProfileId);
      default: // "all"
        return isAdmin 
          ? projects 
          : projects.filter(project => 
              project.status === "approved" || project.status === "implemented" || project.profile_id === userProfileId
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
    if (!userProfileId) return projects.filter(p => p.status === "approved" || p.status === "implemented").length; // For non-logged in or profile not loaded
    return isAdmin 
        ? projects.length 
        : projects.filter(p => p.status === "approved" || p.status === "implemented" || p.profile_id === userProfileId).length;
  }, [projects, isAdmin, userProfileId]);


  if (!isAuthenticated) {
    return (
      <div className="container py-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Please sign in to access ZuLink Projects & Ideas</h2>
      </div>
    );
  }

  return (
    <div>
      <PageTitle 
        title="ZuLink Projects & Ideas" 
        description="Share and discover projects and ideas for Zuitzerland"
        icon={<Lightbulb size={24} />}
        actions={
          <CreateProjectIdeaSheet 
            onProjectCreated={fetchProjects}
            userId={userProfileId} // Pass the profile_id
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

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProjects.map((project) => (
              <ProjectIdeaCard
                key={project.id}
                {...project} // Spread all project properties
                isAdmin={isAdmin}
                currentUserId={userProfileId}
                onStatusUpdate={fetchProjects}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-medium text-gray-500 mb-2">
              {filter === "pending" ? "No pending submissions found" : 
               filter === "my" ? "You haven't submitted any projects or ideas yet" : 
               "No projects or ideas available"}
            </h3>
            <p className="text-gray-400">
              {filter === "my" ? "Click 'Submit Project or Idea' to add your first one" : 
               "Check back later for new submissions or share your own!"}
            </p>
          </div>
        )}

        {/* Removed the paid invoice banner as it's not specified for project submissions */}
      </div>
    </div>
  );
}
