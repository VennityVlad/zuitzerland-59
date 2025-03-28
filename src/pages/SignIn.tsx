
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const SignIn = () => {
  const { login, authenticated, ready, user } = usePrivy();
  const { toast } = useToast();
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false);
  const setupComplete = useRef(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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

  // If already authenticated and setup is complete, redirect immediately
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
    <div className="relative min-h-screen bg-gradient-to-b from-white to-secondary/30 flex flex-col items-center justify-center overflow-hidden py-12">
      {/* Background pattern - visible on larger screens */}
      <div className="absolute inset-0 z-0 opacity-10 hidden md:block">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-hotel-gold/30 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-hotel-navy/20 blur-3xl"></div>
      </div>
      
      <div className="container max-w-4xl mx-auto px-4 z-10 relative">
        {/* Logo container with enhanced sizing and spacing */}
        <div className="flex justify-center mb-10">
          <img 
            src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
            alt="Switzerland Logo"
            className="w-full max-w-xs md:max-w-sm"
          />
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto transform transition-all hover:scale-[1.01] duration-300">
          {/* Top decorative bar */}
          <div className="h-2 bg-gradient-to-r from-hotel-navy to-hotel-gold"></div>
          
          <div className="p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-semibold text-hotel-navy mb-6 text-center">
              Welcome to Zuitzerland
            </h1>
            
            <p className="text-gray-600 mb-8 text-center">
              Your exclusive portal to Alpine luxury
            </p>
            
            <Button 
              onClick={() => {
                console.log('Login button clicked');
                login();
              }}
              className={`w-full py-6 bg-hotel-navy hover:bg-hotel-navy/90 shadow-md hover:shadow-lg transform transition-all duration-200 ${isMobile ? 'text-lg' : ''}`}
            >
              <LogIn className="mr-2" />
              Sign In
            </Button>

            {/* Optional decorative elements */}
            <div className="mt-8 text-center text-xs text-gray-400">
              <p>Premium hospitality experiences await</p>
            </div>
          </div>
        </div>

        {/* Footer attribution - remove if not needed */}
        <div className="mt-12 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Zuitzerland. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
