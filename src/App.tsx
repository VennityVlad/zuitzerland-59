
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { SupabaseAuthProvider } from "@/contexts/SupabaseAuthContext";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SupabaseSignIn from "./pages/SupabaseSignIn";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Invoices from "./pages/Invoices";
import Discounts from "./pages/Discounts";
import RoomTypes from "./pages/RoomTypes";
import Reports from "./pages/Reports";
import Book from "./pages/Book";
import NavMenu from "./components/NavMenu";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "./components/ui/use-toast";
import { useIsMobile } from "./hooks/use-mobile";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authenticated, ready } = usePrivy();
  const isMobile = useIsMobile();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }
  
  if (!authenticated) {
    return <Navigate to="/signin" replace />;
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
    <QueryClientProvider client={queryClient}>
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
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Test route for Supabase auth */}
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
                  path="/invoices"
                  element={
                    <ProtectedRoute>
                      <Invoices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reports"
                  element={
                    <ProtectedRoute>
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/discounts"
                  element={
                    <ProtectedRoute>
                      <Discounts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/room-types"
                  element={
                    <ProtectedRoute>
                      <RoomTypes />
                    </ProtectedRoute>
                  }
                />
                <Route path="*" element={<Navigate to="/signin" replace />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SupabaseAuthProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
};

export default App;
