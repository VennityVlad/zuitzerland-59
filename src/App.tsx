
import React, { useState } from 'react';
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

function App() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <PrivyProvider
            appId={import.meta.env.VITE_PRIVY_APP_ID || "clh5qqfup00ismc08zcwj65i9"}
            onSuccess={() => console.log("Privy auth success")}
            config={{
              loginMethods: ["email", "wallet"],
              appearance: {
                theme: "light",
                accentColor: "#676FFF",
                logo: "https://lovable-uploads.s3.amazonaws.com/2796594c-9800-4554-b79d-a1da8992c369.png",
              },
            }}
          >
            <SupabaseAuthProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/book" element={<Book />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/discounts" element={<Discounts />} />
                  <Route path="/room-types" element={<RoomTypes />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/sign-in" element={<SignIn />} />
                  <Route path="/supabase-sign-in" element={<SupabaseSignIn />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
              <Toaster />
              <Sonner />
            </SupabaseAuthProvider>
          </PrivyProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

export default App;
