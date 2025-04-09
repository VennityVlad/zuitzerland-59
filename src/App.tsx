
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
import NavMenu from "./components/NavMenu";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./components/ui/use-toast";
import { useIsMobile } from "./hooks/use-mobile";
import { usePageTracking } from "./hooks/usePageTracking";

const PageTrackingWrapper = ({ children }: { children: React.ReactNode }) => {
  usePageTracking();
  return <>{children}</>;
};

const ProtectedRoute = ({ 
  children, 
  adminOnly = false 
}: { 
  children: React.ReactNode;
  adminOnly?: boolean;
}) => {
  const { authenticated, ready } = usePrivy();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = usePrivy();
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        setIsAdmin(data?.role === 'admin');
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      checkAdminStatus();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

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
                path="/housing-preferences"
                element={
                  <ProtectedRoute>
                    <HousingPreferences />
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
