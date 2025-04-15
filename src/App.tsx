import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SupabaseSignIn from "./pages/SupabaseSignIn";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import HousingPreferences from "./pages/HousingPreferences";
import Invoices from "./pages/Invoices";
import Discounts from "./pages/Discounts";
import RoomTypes from "./pages/RoomTypes";
import Reports from "./pages/Reports";
import Book from "./pages/Book";
import Teams from "./pages/Teams";
import UserManagement from "./pages/UserManagement";
import Events from "./pages/Events";
import RoomManagement from "./pages/RoomManagement";
import RoomAssignmentsPage from "./pages/rooms/RoomAssignmentsPage";
import Onboarding from "./pages/Onboarding";
import NavMenu from "./components/NavMenu";
import TransportationGuide from "./pages/TransportationGuide";
import Directory from "./pages/Directory";
import { useIsMobile } from "./hooks/use-mobile";
import { usePageTracking } from "./hooks/usePageTracking";

const PageTrackingWrapper = ({ children }: { children: React.ReactNode }) => {
  usePageTracking();
  return <>{children}</>;
};

const ProtectedRoute = ({ 
  children, 
  adminOnly = false,
  pageKey = ''
}: { 
  children: React.ReactNode;
  adminOnly?: boolean;
  pageKey?: string;
}) => {
  const { authenticated, ready, user } = usePrivy();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPageEnabled, setIsPageEnabled] = useState(true);
  const [hasValidInvoice, setHasValidInvoice] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const checkPageAccess = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Check page settings
        if (pageKey) {
          const { data: settingsData, error: settingsError } = await supabase
            .from('settings')
            .select('value')
            .eq('key', pageKey)
            .maybeSingle();

          if (settingsError) throw settingsError;
          
          if (settingsData) {
            const isEnabled = settingsData.value?.enabled ?? true;
            setIsPageEnabled(isEnabled);
            
            if (!isEnabled) {
              navigate('/book');
              return;
            }
          }
        }

        // Check admin status
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, id')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        
        setIsAdmin(profileData?.role === 'admin');

        // Check for valid invoices
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('id')
          .eq('profile_id', profileData?.id)
          .in('status', ['paid', 'pending'])
          .maybeSingle();

        if (invoiceError) throw invoiceError;
        
        const hasInvoice = !!invoiceData;
        setHasValidInvoice(hasInvoice);

        // Redirect if no valid invoice for non-admin routes
        if (!hasInvoice && !adminOnly) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "You need a paid invoice to access this page."
          });
          navigate('/book');
        }
      } catch (error) {
        console.error('Error checking page access:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      checkPageAccess();
    } else {
      setIsLoading(false);
    }
  }, [user?.id, pageKey, navigate, toast, adminOnly]);

  if (!ready || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!authenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/book" replace />;
  }

  return (
    <div className={`flex min-h-screen ${isMobile ? 'bg-white' : 'bg-secondary/30'}`}>
      <NavMenu />
      <div className="flex-1 relative">
        {children}
      </div>
    </div>
  );
};

const App = () => {
  const [privyAppId, setPrivyAppId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPrivyAppId = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-secret', {
          body: { secretName: 'PRIVY_APP_ID' }
        });

        if (error) {
          console.error('Error fetching Privy App ID:', error);
          setError('Failed to fetch authentication configuration');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch authentication configuration"
          });
          return;
        }

        if (!data?.secret) {
          setError('Authentication configuration is missing');
          toast({
            variant: "destructive",
            title: "Error",
            description: "Authentication configuration is missing"
          });
          return;
        }

        setPrivyAppId(data.secret);
      } catch (error) {
        console.error('Error in fetchPrivyAppId:', error);
        setError('Failed to initialize authentication');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize authentication"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivyAppId();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  if (error || !privyAppId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error || 'Authentication configuration is missing'}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <PrivyProvider
        appId={privyAppId}
        config={{
          loginMethods: ['email'],
          appearance: {
            theme: 'light',
            accentColor: '#1a365d',
            logo: '/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png',
          },
          embeddedWallets: {
            createOnLogin: 'users-without-wallets'
          }
        }}
      >
        <SupabaseAuthProvider>
          <PageTrackingWrapper>
            <Routes>
              <Route path="/supabase-signin" element={<SupabaseSignIn />} />
              
              <Route path="/signin" element={<SignIn />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Index />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/book"
                element={
                  <ProtectedRoute>
                    <Book />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute pageKey="show_onboarding_page">
                    <Onboarding />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/directory"
                element={
                  <ProtectedRoute pageKey="show_directory_page">
                    <Directory />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Invoices />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Reports />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/discounts"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Discounts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events"
                element={
                  <ProtectedRoute>
                    <Events />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/room-types"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <RoomTypes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/teams"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <Teams />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-management"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/room-management"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <RoomManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/room-assignments"
                element={
                  <ProtectedRoute adminOnly={true}>
                    <RoomAssignmentsPage />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/signin" replace />} />
            </Routes>
          </PageTrackingWrapper>
        </SupabaseAuthProvider>
      </PrivyProvider>
    </TooltipProvider>
  );
};

export default App;
