
import { useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { usePrivy } from "@privy-io/react-auth";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = usePrivy();

  useEffect(() => {
    // Debug logging
    console.log("Index: Mounting with pathname:", location.pathname);
    console.log("Index: Search params:", Object.fromEntries(searchParams.entries()));
    
    // Check if we have any special redirect parameters
    const housingPrefsParam = searchParams.get('housingPreferences');
    
    const redirectToAppropriateRoute = async () => {
      // If specific housing preferences parameter is set, prioritize that redirect
      if (housingPrefsParam === 'true') {
        console.log("Index: Redirecting to housing preferences due to parameter");
        navigate("/housing-preferences", { replace: true });
        return;
      }
      
      // If we have an authenticated user, check if they have a paid invoice
      if (user?.id) {
        try {
          // Get user's profile to find their profile ID
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('privy_id', user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          if (!profileData) {
            console.log("Index: No profile found for user, redirecting to book");
            navigate("/book", { replace: true });
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
          
          // User has a paid invoice, redirect to events
          if (invoiceData) {
            console.log("Index: User has paid invoice, redirecting to events");
            navigate("/events", { replace: true });
          } else {
            // Default to book page for users without paid invoices
            console.log("Index: No paid invoice found, redirecting to book");
            navigate("/book", { replace: true });
          }
        } catch (error) {
          console.error("Error checking invoice status:", error);
          // Fallback to book page on error
          navigate("/book", { replace: true });
        }
      } else {
        // Not authenticated, redirect to book page
        console.log("Index: No authenticated user, redirecting to book");
        navigate("/book", { replace: true });
      }
    };
    
    // Add a small delay to ensure routing is initialized
    const timer = setTimeout(() => {
      redirectToAppropriateRoute();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [navigate, location.pathname, searchParams, user]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Redirecting...</div>
    </div>
  );
};

export default Index;
