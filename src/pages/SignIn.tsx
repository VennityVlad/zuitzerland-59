
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const { login, authenticated, ready, user } = usePrivy();
  const { toast } = useToast();
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false);
  const setupComplete = useRef(false);
  const navigate = useNavigate();

  const setupAuth = useCallback(async () => {
    if (!user?.email?.address || isSettingUpProfile || setupComplete.current) {
      return;
    }

    setIsSettingUpProfile(true);

    try {
      console.log('Privy user authenticated:', {
        id: user.id,
        email: user.email.address
      });

      // Check for existing profile by email
      console.log('Checking for existing profile by email...');
      const { data: existingProfiles, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email.address);

      if (profileCheckError) {
        console.error('Error checking existing profile:', profileCheckError);
        throw profileCheckError;
      }

      console.log('Existing profiles found:', existingProfiles);

      if (existingProfiles && existingProfiles.length > 0) {
        // Use the first profile found with this email
        const existingProfile = existingProfiles[0];
        console.log('Found existing profile:', existingProfile);

        // Only update if privy_id is different
        if (existingProfile.privy_id !== user.id.toString()) {
          // Update profile with new Privy ID
          const updateData = {
            privy_id: user.id.toString(),
            email: user.email.address
          };

          console.log('Updating profile with data:', updateData);
          const { error: updateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error('Error updating profile:', updateError);
            throw updateError;
          }

          console.log('Profile updated successfully');
        } else {
          console.log('Profile already up to date');
        }
      } else {
        // Create new profile if no existing profile found
        console.log('No existing profile found, creating new profile...');
        const newProfileId = crypto.randomUUID();
        const { error: createError } = await supabase
          .from('profiles')
          .insert({
            id: newProfileId,
            privy_id: user.id.toString(),
            email: user.email.address,
            username: null // This will trigger the generate_username() function
          });

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
        console.log('New profile created successfully');
      }

      console.log('Auth setup completed successfully');
      setupComplete.current = true;
      
      // Use React Router's navigate instead of window.location
      navigate("/");

    } catch (error) {
      console.error('Error in auth setup:', error);
      toast({
        title: "Authentication Error",
        description: "There was an error setting up your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSettingUpProfile(false);
    }
  }, [user, isSettingUpProfile, toast, navigate]);

  useEffect(() => {
    if (authenticated && user && !isSettingUpProfile && !setupComplete.current) {
      console.log('Starting auth setup process...');
      setupAuth();
    }
  }, [authenticated, user, setupAuth, isSettingUpProfile]);

  useEffect(() => {
    if (authenticated && setupComplete.current && !isSettingUpProfile) {
      navigate("/");
    }
  }, [authenticated, isSettingUpProfile, navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (authenticated && isSettingUpProfile) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Setting up your profile...</div>
      </div>
    );
  }

  if (authenticated && !isSettingUpProfile && setupComplete.current) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Redirecting...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/lovable-uploads/d74a7f50-2043-4469-b19f-85dd74e411a5.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Overlay to ensure text readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      <div className="container max-w-4xl mx-auto relative z-10">
        <div className="mb-8 bg-white/90 p-4 rounded-xl inline-block backdrop-blur-sm">
          <img 
            src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
            alt="Switzerland Logo"
            className="h-24 w-auto"
          />
        </div>
        
        <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-hotel-navy mb-6 text-center">
            Welcome to Switzerland Booking Portal
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
            Please sign in to access the booking form
          </p>
          
          <Button 
            onClick={() => {
              console.log('Login button clicked');
              login();
            }}
            className="w-full py-6 bg-hotel-navy hover:bg-hotel-navy/90 transition-colors duration-200"
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
