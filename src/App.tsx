import "./App.css";
import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { usePrivy } from "@privy-io/react-auth";

// Regular pages
import Index from "./pages/Index";
import Book from "./pages/Book";
import SignIn from "./pages/SignIn";
import Profile from "./pages/Profile";
import Invoices from "./pages/Invoices";
import NotFound from "./pages/NotFound";
import Reports from "./pages/Reports";
import RoomTypes from "./pages/RoomTypes";
import RoomManagement from "./pages/RoomManagement";
import ImportApartments from "./pages/ImportApartments";
import UserManagement from "./pages/UserManagement";
import Teams from "./pages/Teams";
import RoomAssignmentsPage from "./pages/rooms/RoomAssignmentsPage";
import Events from "./pages/Events";
import Discounts from "./pages/Discounts";
import HousingPreferences from "./pages/HousingPreferences";
import SupabaseSignIn from "./pages/SupabaseSignIn";

import NavMenu from "./components/NavMenu";
import BottomNav from "./components/BottomNav";
import { usePageTracking } from "./hooks/usePageTracking";

function App() {
  usePageTracking();
  const location = useLocation();
  const navigate = useNavigate();
  const { ready, authenticated } = usePrivy();

  useEffect(() => {
    if (ready && !authenticated && location.pathname !== "/signin") {
      console.log("App - Not authenticated");
      navigate("/signin");
    }
  }, [ready, authenticated, location, navigate]);

  return (
    <>
      <NavMenu />

      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/book" element={<Book />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/invoices/*" element={<Invoices />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/room-management" element={<RoomManagement />} />
        <Route path="/apartments/import" element={<ImportApartments />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/teams" element={<Teams />} />
        <Route path="/room-types" element={<RoomTypes />} />
        <Route path="/room-assignments" element={<RoomAssignmentsPage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/discounts" element={<Discounts />} />
        <Route path="/housing-preferences" element={<HousingPreferences />} />
        <Route path="/supabase-signin" element={<SupabaseSignIn />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <BottomNav />
      <Toaster />
    </>
  );
}

export default App;
