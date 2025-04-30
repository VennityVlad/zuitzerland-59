
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const SignIn = () => {
  const { login, authenticated, ready, user } = usePrivy();
  const { toast } = useToast();
  const [isSettingUpProfile, setIsSettingUpProfile] = useState(false);
  const setupComplete = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectToHousingPreferences = searchParams.get('housingPreferences') === 'true';
  
  // Get the intended destination from URL params or referrer
  const intendedPath = searchParams.get('redirect') || 
                        (location.state && location.state.from) || 
                        '/';

  useEffect(() => {
    // Log the current params for debugging
    console.log('SignIn: URL params:', {
      redirectToHousingPreferences,
      intendedPath,
      searchParams: Object.fromEntries(searchParams.entries()),
      pathname: location.pathname
    });
  }, [searchParams, redirectToHousingPreferences, location.pathname, intendedPath]);

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

      // Generate Supabase JWT for the authenticated Privy user
      try {
        const response = await fetch("https://cluqnvnxjexrhhgddoxu.supabase.co/functions/v1/generate-supabase-jwt", {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsdXFudm54amV4cmhoZ2Rkb3h1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg5MzM0MzQsImV4cCI6MjA1NDUwOTQzNH0.1F5eYt59BKGemUfRHD0bHhlIQ_k1hmSDLh7ixa03w6k`,
          },
          body: JSON.stringify({ privyUserId: user.id })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error generating Supabase JWT:', errorData);
          // Continue with authentication process even if JWT generation fails
          // The useAuthenticatedSupabase hook will handle JWT generation later
        } else {
          console.log('Successfully generated Supabase JWT');
          // The JWT is now stored in localStorage via the useAuthenticatedSupabase hook
        }
      } catch (jwtError) {
        console.error('Error calling generate-supabase-jwt function:', jwtError);
        // Continue with authentication process even if JWT generation fails
      }

      console.log('Auth setup completed successfully');
      setupComplete.current = true;
      
      // After successful login, check if the user has a paid invoice
      try {
        // Get user's profile to find their profile ID
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) {
          console.log("No profile found, redirecting to root");
          navigate("/", { replace: true });
          return;
        }

        // Check if user has a paid invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('id')
          .eq('profile_id', profileData.id)
          .eq('status', 'paid')
          .maybeSingle();

        if (invoiceError) throw invoiceError;
        
        // Handle redirects based on URL params and invoice status
        console.log('Redirecting after auth. Housing preferences param:', redirectToHousingPreferences);
        console.log('Intended path:', intendedPath);
        
        // Check if we're trying to go to an event page
        const isEventPage = intendedPath.startsWith('/events/');
        
        if (redirectToHousingPreferences) {
          navigate("/housing-preferences", { replace: true });
        } else if (isEventPage && (invoiceData || profileData.role === 'admin')) {
          // If trying to access a specific event page and has paid invoice or is admin
          navigate(intendedPath, { replace: true });
        } else if (invoiceData || profileData.role === 'admin') {
          // User has a paid invoice or is admin, redirect to events
          navigate("/events", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error('Error checking invoice status:', error);
        navigate("/", { replace: true });
      }

    } catch (error) {
      console.error('Error in auth setup:', error);
      toast({
        title: "Authentication Error",
        description: "There was an error setting up your profile. Please try again.",
        variant: "destructive",
      });
      setupComplete.current = false;
    } finally {
      setIsSettingUpProfile(false);
    }
  }, [user, isSettingUpProfile, toast, navigate, redirectToHousingPreferences, intendedPath]);

  useEffect(() => {
    if (authenticated && user && !isSettingUpProfile && !setupComplete.current) {
      console.log('Starting auth setup process...');
      setupAuth();
    }
  }, [authenticated, user, setupAuth, isSettingUpProfile]);

  // If already authenticated and setup is complete, redirect immediately
  useEffect(() => {
    if (authenticated && setupComplete.current && !isSettingUpProfile) {
      // This will be handled by the setupAuth function which checks invoice status
      console.log('Already authenticated, redirecting will be handled by setupAuth');
    }
  }, [authenticated, isSettingUpProfile, navigate, redirectToHousingPreferences]);

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
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <img 
          src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
          alt="Switzerland Logo"
          className="logo"
          onError={(e) => {
            console.error("Image failed to load, attempting fallback", e);
            e.currentTarget.src = "/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png";
          }}
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
