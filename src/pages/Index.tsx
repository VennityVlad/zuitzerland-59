
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    // Only redirect if we have a user and we're on the index page
    if (user && window.location.pathname === "/") {
      console.log("Index: Redirecting authenticated user to /book");
      navigate("/book", { replace: true });
    }
  }, [navigate, user]);

  return null;
};

export default Index;
