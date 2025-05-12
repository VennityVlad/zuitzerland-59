
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
    
    // Capture the intended path if we're coming from a direct URL
    const redirectPath = location.pathname === '/' ? null : location.pathname;
    
    const redirectToAppropriateRoute = async () => {
      // If specific housing preferences parameter is set, prioritize that redirect
      if (housingPrefsParam === 'true') {
        console.log("Index: Redirecting to housing preferences due to parameter");
        navigate("/housing-preferences", { replace: true });
        return;
      }
      
      // Handle direct access to event page
      const isEventPage = redirectPath && redirectPath.startsWith('/events/');
      
      // If we have an authenticated user, check if they have a paid invoice
      if (user?.id) {
        try {
          console.log("Index: Checking access status for user:", user.id);
          
          // Get user's profile to find their profile ID
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role')
            .eq('privy_id', user.id)
            .maybeSingle();

          if (profileError) throw profileError;
          if (!profileData) {
            console.log("Index: No profile found for user, redirecting to book");
            navigate("/book", { replace: true });
            return;
          }

          // Check if user has a paid invoice - using limit(1) instead of maybeSingle()
          // to correctly handle users with multiple paid invoices
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoices')
            .select('id')
            .eq('profile_id', profileData.id)
            .eq('status', 'paid')
            .limit(1);

          if (invoiceError) throw invoiceError;
          
          const isAdmin = profileData.role === 'admin';
          const hasPaidInvoice = Array.isArray(invoiceData) && invoiceData.length > 0;
          
          console.log("Index: Access check results:", {
            isAdmin,
            hasPaidInvoice,
            invoiceCount: invoiceData?.length
          });
          
          // Handle redirects based on invoice status and intended path
          if ((hasPaidInvoice || isAdmin) && isEventPage) {
            // Redirect to the specific event page if that's where they were trying to go
            console.log(`Index: User has access, redirecting to specific event page: ${redirectPath}`);
            navigate(redirectPath, { replace: true });
          } else if (hasPaidInvoice || isAdmin) {
            // User has a paid invoice or is admin, redirect to events
            console.log("Index: User has paid invoice or is admin, redirecting to events");
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
        // Not authenticated, redirect to sign-in with intended destination
        console.log("Index: No authenticated user, redirecting to signin");
        if (isEventPage) {
          // If trying to access a specific event page, include it in the redirect params
          navigate(`/signin?redirect=${encodeURIComponent(redirectPath)}`, { replace: true });
        } else {
          navigate("/signin", { replace: true });
        }
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
