
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SignIn = () => {
  const { login, authenticated, ready, user } = usePrivy();
  const { toast } = useToast();

  useEffect(() => {
    const setupAuth = async () => {
      if (!user) {
        console.log('No Privy user available yet');
        return;
      }

      console.log('Privy user authenticated:', {
        id: user.id,
        email: user.email?.address
      });

      try {
        // Check for existing profile with matching email
        console.log('Checking for existing profile by email...');
        const { data: existingProfiles, error: profileCheckError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email?.address);

        if (profileCheckError) {
          console.error('Error checking existing profile:', profileCheckError);
          throw profileCheckError;
        }

        let profileId: string;

        if (existingProfiles && existingProfiles.length > 0) {
          // Use the first profile found with this email
          const existingProfile = existingProfiles[0];
          profileId = existingProfile.id;

          console.log('Updating existing profile:', existingProfile.id);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              privy_id: user.id.toString(),
              email: user.email?.address // Ensure email is set
            })
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            throw updateError;
          }
          console.log('Profile updated successfully');
        } else {
          // Create new profile if no existing profile found
          console.log('No existing profile found, creating new profile...');
          const newProfileId = crypto.randomUUID();
          const { error: createError } = await supabase
            .from('profiles')
            .insert({
              id: newProfileId,
              privy_id: user.id.toString(),
              email: user.email?.address,
              username: null // This will trigger the generate_username() function
            });

          if (createError) {
            console.error('Error creating profile:', createError);
            throw createError;
          }
          profileId = newProfileId;
          console.log('New profile created successfully');
        }

        console.log('Auth setup completed successfully');

      } catch (error) {
        console.error('Error in auth setup:', error);
        toast({
          title: "Error",
          description: "Failed to complete authentication setup",
          variant: "destructive",
        });
      }
    };

    if (authenticated && user) {
      console.log('Starting auth setup process...');
      setupAuth();
    } else {
      console.log('Waiting for Privy authentication...', {
        authenticated,
        userPresent: !!user
      });
    }
  }, [authenticated, user]);

  if (!ready) {
    console.log('Privy not ready yet');
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (authenticated) {
    console.log('User authenticated, redirecting to home...');
    window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <img 
          src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
          alt="Switzerland Logo"
          className="logo"
        />
        
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-hotel-navy mb-6 text-center">
            Welcome to the Zuitzerland Portal
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
            Please sign in to access the booking form
          </p>
          
          <Button 
            onClick={() => {
              console.log('Login button clicked');
              login();
            }}
            className="w-full py-6 bg-hotel-navy hover:bg-hotel-navy/90"
          >
            <LogIn className="mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
