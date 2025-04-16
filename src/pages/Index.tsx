
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Add a small delay to ensure routing is initialized
    const timer = setTimeout(() => {
      navigate("/book", { replace: true });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Redirecting to booking page...</div>
    </div>
  );
};

export default Index;
