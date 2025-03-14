import React, { Suspense, useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { PrivyProvider } from '@privy-io/react-auth';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'sonner';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-sveltekit';
import { Session } from '@supabase/supabase-js';
import Index from './pages/Index';
import SignIn from './pages/SignIn';
import SupabaseSignIn from './pages/SupabaseSignIn';
import Book from './pages/Book';
import Invoices from './pages/Invoices';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Discounts from './pages/Discounts';
import RoomTypes from './pages/RoomTypes';
import NotFound from './pages/NotFound';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import PrivyRoute from './components/PrivyRoute';
import UserManagement from './pages/UserManagement';
import ProfileEdit from './pages/ProfileEdit';

const queryClient = new QueryClient();

function App() {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, [supabaseClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseAuthProvider>
        <Suspense fallback={<p>Loading...</p>}>
          <PrivyProvider
            appId={process.env.REACT_APP_PRIVY_APP_ID || ""}
            config={{
              loginMethods: ['email', 'google', 'apple', 'twitter', 'discord'],
              appearance: {
                accentColor: '#1A1F2C',
                fontFamily: 'Inter, sans-serif',
                borderRadius: 12,
                theme: 'light',
              },
            }}
          >
            <Toaster position="top-right" />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<SupabaseSignIn />} />
              <Route path="/signin" element={<SignIn />} />
              <Route
                path="/book"
                element={
                  <PrivyRoute>
                    <Book />
                  </PrivyRoute>
                }
              />
              <Route
                path="/invoices"
                element={
                  <PrivyRoute>
                    <Invoices />
                  </PrivyRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <PrivyRoute>
                    <Reports />
                  </PrivyRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <PrivyRoute>
                    <Profile />
                  </PrivyRoute>
                }
              />
              <Route
                path="/discounts"
                element={
                  <PrivyRoute>
                    <Discounts />
                  </PrivyRoute>
                }
              />
              <Route
                path="/room-types"
                element={
                  <PrivyRoute>
                    <RoomTypes />
                  </PrivyRoute>
                }
              />
              <Route
                path="/user-management"
                element={
                  <PrivyRoute>
                    <UserManagement />
                  </PrivyRoute>
                }
              />
              <Route
                path="/profile-edit/:id"
                element={
                  <PrivyRoute>
                    <ProfileEdit />
                  </PrivyRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </PrivyProvider>
        </Suspense>
      </SupabaseAuthProvider>
    </QueryClientProvider>
  );
}

export default App;
