
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import Invoices from "./pages/Invoices";
import NavMenu from "./components/NavMenu";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { authenticated, ready } = usePrivy();

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
    <>
      <NavMenu />
      {children}
    </>
  );
};

const App = () => {
  const [privyAppId, setPrivyAppId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPrivyAppId = async () => {
      const { data, error } = await supabase
        .from('secrets')
        .select('value')
        .eq('name', 'VITE_PRIVY_APP_ID')
        .single();

      if (error) {
        console.error('Error fetching Privy App ID:', error);
        return;
      }

      if (data) {
        setPrivyAppId(data.value);
      }
      setIsLoading(false);
    };

    fetchPrivyAppId();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
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
        }}
      >
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
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
              <Route path="*" element={<Navigate to="/signin" replace />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
};

export default App;
