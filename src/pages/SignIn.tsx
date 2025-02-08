
import { usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { LogIn } from "lucide-react";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

const SignIn = () => {
  const { login, authenticated, ready, user } = usePrivy();
  const { toast } = useToast();

  useEffect(() => {
    const createProfileAndMapping = async () => {
      if (!user) return;

      try {
        const privyId = user.id.replace('did:privy:', '');
        
        // Check if mapping already exists
        const { data: existingMapping } = await supabase
          .from('user_mappings')
          .select('internal_id')
          .eq('privy_id', privyId)
          .maybeSingle();

        if (existingMapping) {
          // If mapping exists, we're done
          return;
        }

        // Generate a new internal UUID for this user
        const internalId = uuidv4();
        
        // Create new profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: internalId,
            email: user.email?.address || null,
            username: null  // This will trigger the generate_username() function
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          throw profileError;
        }

        // Create mapping between Privy ID and internal UUID
        const { error: mappingError } = await supabase
          .from('user_mappings')
          .insert({
            privy_id: privyId,
            internal_id: internalId
          });

        if (mappingError) {
          console.error('Error creating user mapping:', mappingError);
          throw mappingError;
        }

      } catch (error) {
        console.error('Error in profile/mapping creation:', error);
        toast({
          title: "Error",
          description: "Something went wrong",
          variant: "destructive",
        });
      }
    };

    if (authenticated && user) {
      createProfileAndMapping();
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
