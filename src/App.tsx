
import React from 'react';
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Routes, Route, Navigate } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import { SupabaseJwtProvider } from "@/components/SupabaseJwtProvider";
import SessionValidator from "@/components/SessionValidator";
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
import AvailabilityPage from "./pages/rooms/AvailabilityPage";
import { HelmetProvider } from 'react-helmet-async';
import EventPage from "./pages/events/EventPage";
import PrivacyDashboard from "./pages/PrivacyDashboard";
import Settings from "./pages/Settings";
import DisplayPage from "./pages/DisplayPage";

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
  const [isAccessValid, setIsAccessValid] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const validateAccess = async () => {
      if (!user?.id || !user?.email) return true;
      
      try {
        const { data, error } = await supabase.functions.invoke("validate-user-access", {
          body: { email: user.email }
        });
        
        if (error) {
          console.error("Error validating access:", error);
          return true; // Default to allowing access if there's an error
        }
        
        if (data && data.revoked) {
          toast({
            title: "Access Revoked",
            description: "Your account access has been revoked.",
            variant: "destructive",
          });
          setIsAccessValid(false);
          return false;
        }
        
        setIsAccessValid(true);
        return true;
      } catch (err) {
        console.error("Failed to validate access:", err);
        return true; // Default to allowing access if there's an error
      }
    };
    
    const checkPageAccess = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // First validate user access
        const valid = await validateAccess();
        if (!valid) {
          navigate('/signin');
          return;
        }
      
        if (pageKey) {
          const { data: settingsData, error: settingsError } = await supabase
            .from('settings')
            .select('value')
            .eq('key', pageKey)
            .maybeSingle();

          if (settingsError) throw settingsError;
          
          if (settingsData) {
            let valueObj;
            if (typeof settingsData.value === 'string') {
              try {
                valueObj = JSON.parse(settingsData.value);
              } catch (e) {
                valueObj = { enabled: true };
              }
            } else {
              valueObj = settingsData.value;
            }
            
            const isEnabled = valueObj?.enabled ?? true;
            setIsPageEnabled(isEnabled);
            
            if (!isEnabled) {
              navigate('/book');
              return;
            }
          }
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('role, id')
          .eq('privy_id', user.id)
          .maybeSingle();

        if (profileError) throw profileError;
        
        setIsAdmin(profileData?.role === 'admin');

        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('id')
          .eq('profile_id', profileData?.id)
          .eq('status', 'paid')
          .maybeSingle();

        if (invoiceError) throw invoiceError;
        
        const hasInvoice = !!invoiceData;
        setHasValidInvoice(hasInvoice);

        if (!hasInvoice && !adminOnly && pageKey) {
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
  
  if (!authenticated || !isAccessValid) {
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

function AppRoutes() {
  return (
    <Routes>
      <Route path="/supabase-signin" element={<SupabaseSignIn />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/display" element={<DisplayPage />} />
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
        path="/settings"
        element={
          <ProtectedRoute adminOnly={true}>
            <Settings />
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
      <Route
        path="/availability"
        element={
          <ProtectedRoute adminOnly={true}>
            <AvailabilityPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events/:eventId"
        element={
          <ProtectedRoute>
            <EventPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/privacy"
        element={
          <ProtectedRoute>
            <PrivacyDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/404" element={<NotFound />} />
      <Route path="*" element={<Navigate to="/404" />} />
    </Routes>
  );
}

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
      <HelmetProvider>
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
          <SupabaseJwtProvider>
            <SupabaseAuthProvider>
              <SessionValidator />
              <PageTrackingWrapper>
                <AppRoutes />
              </PageTrackingWrapper>
            </SupabaseAuthProvider>
          </SupabaseJwtProvider>
        </PrivyProvider>
      </HelmetProvider>
    </TooltipProvider>
  );
};

export default App;
