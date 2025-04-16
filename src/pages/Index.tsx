
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Debug logging
    console.log("Index: Mounting with pathname:", location.pathname);
    
    // Add a small delay to ensure routing is initialized
    const timer = setTimeout(() => {
      console.log("Index: Redirecting to book page");
      navigate("/book", { replace: true });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [navigate, location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Redirecting to booking page...</div>
    </div>
  );
};

export default Index;
