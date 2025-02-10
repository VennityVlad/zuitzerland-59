
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SignIn = () => {
  const { login, authenticated, ready, user, getAccessToken } = usePrivy();
  const { toast } = useToast();

  useEffect(() => {
    const setupAuth = async () => {
      if (!user) return;

      try {
        const privyToken = await getAccessToken();
        if (!privyToken) {
          console.error('No Privy token available');
          return;
        }

        // First check if profile exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('privy_id', user.id)
          .maybeSingle();

        // Create new profile if it doesn't exist
        if (!existingProfile) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: crypto.randomUUID(),
              privy_id: user.id,
              email: user.email?.address || null,
              username: null,  // This will trigger the generate_username() function
              auth_token: privyToken
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
            throw profileError;
          }
        } else {
          // Update existing profile's auth token
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ auth_token: privyToken })
            .eq('privy_id', user.id);

          if (updateError) {
            console.error('Error updating profile auth token:', updateError);
            throw updateError;
          }
        }

        // Create Supabase session using the Privy token
        const { data: { session }, error: sessionError } = await supabase.auth.signInWithPassword({
          email: user.email?.address || 'placeholder@example.com',
          password: privyToken,
        });

        if (sessionError) {
          console.error('Error creating Supabase session:', sessionError);
          throw sessionError;
        }

        console.log('Successfully established Supabase session');

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
      setupAuth();
    }
  }, [authenticated, user]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (authenticated) {
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
            Welcome to Switzerland Booking Portal
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
            Please sign in to access the booking form
          </p>
          
          <Button 
            onClick={login}
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
