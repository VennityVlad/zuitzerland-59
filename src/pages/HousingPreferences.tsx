
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate, useLocation } from "react-router-dom";
import { PageTitle } from "@/components/PageTitle";
import { supabase } from "@/integrations/supabase/client";
import HousingPreferencesForm from "@/components/profile/HousingPreferencesForm";
import { useToast } from "@/hooks/use-toast";

const HousingPreferences = () => {
  const { user, authenticated, ready } = usePrivy();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Debug logging
    console.log("HousingPreferences: Mount with", { 
      authenticated, 
      ready, 
      userId: user?.id,
      pathname: location.pathname
    });
    
    // If not authenticated, redirect to sign in with a parameter
    if (ready && !authenticated) {
      console.log("HousingPreferences: Not authenticated, redirecting to sign in");
      navigate("/signin?housingPreferences=true", { replace: true });
      return;
    }

    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        console.log("HousingPreferences: Fetching profile for user", user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching profile:', error);
          throw error;
        }

        if (data) {
          console.log("HousingPreferences: Profile found", data);
          setProfileData(data);
        } else {
          console.log("HousingPreferences: No profile found");
          toast({
            title: "Error",
            description: "No profile found for your account",
            variant: "destructive",
          });
          // Don't redirect if no profile found - let user see the error on this page
        }
      } catch (error: any) {
        console.error('Error:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (authenticated && user?.id) {
      fetchProfile();
    }
  }, [ready, authenticated, user?.id, navigate, toast, location.pathname]);

  // Handle successful form submission
  const handleSuccess = () => {
    console.log("HousingPreferences: Form submitted successfully");
    toast({
      title: "Success",
      description: "Housing preferences saved successfully",
    });
    navigate("/profile");
  };

  if (!ready) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (ready && !authenticated) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Redirecting to sign in...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <PageTitle 
        title="Housing Preferences" 
        description="Help us match you with compatible roommates"
      />
      <div className="py-8 px-4 flex-grow">
        <div className="container max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            {isLoading ? (
              <div className="animate-pulse">Loading profile data...</div>
            ) : profileData ? (
              <HousingPreferencesForm
                profileId={profileData.id}
                userEmail={profileData.email}
                userName={profileData.username}
                onSuccess={handleSuccess}
              />
            ) : (
              <div className="text-center p-6">
                <p className="text-red-500 font-medium">No profile data found for your account.</p>
                <button 
                  onClick={() => navigate('/profile')} 
                  className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
                >
                  Go to Profile
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousingPreferences;
