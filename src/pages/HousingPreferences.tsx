
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import { PageTitle } from "@/components/PageTitle";
import { supabase } from "@/integrations/supabase/client";
import HousingPreferencesForm from "@/components/profile/HousingPreferencesForm";
import { useToast } from "@/hooks/use-toast";

const HousingPreferences = () => {
  const { user, authenticated, ready } = usePrivy();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If not authenticated, redirect to sign in with a parameter
    if (ready && !authenticated) {
      navigate("/signin?housingPreferences=true");
      return;
    }

    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
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
          setProfileData(data);
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
  }, [ready, authenticated, user?.id, navigate]);

  // Handle successful form submission
  const handleSuccess = () => {
    toast({
      title: "Success",
      description: "Housing preferences saved successfully",
    });
    navigate("/profile");
  };

  if (!ready || (ready && !authenticated)) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Redirecting to sign in...</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <PageTitle title="Housing Preferences" />
        <div className="py-8 px-4 flex-grow">
          <div className="container max-w-4xl mx-auto">
            <div className="animate-pulse">Loading...</div>
          </div>
        </div>
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
            {profileData && (
              <HousingPreferencesForm
                profileId={profileData.id}
                userEmail={profileData.email}
                userName={profileData.username}
                onSuccess={handleSuccess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousingPreferences;
