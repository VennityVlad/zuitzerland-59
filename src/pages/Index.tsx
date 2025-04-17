
import { useEffect } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Debug logging
    console.log("Index: Mounting with pathname:", location.pathname);
    console.log("Index: Search params:", Object.fromEntries(searchParams.entries()));
    
    // Check if we have any special redirect parameters
    const housingPrefsParam = searchParams.get('housingPreferences');
    
    // Add a small delay to ensure routing is initialized
    const timer = setTimeout(() => {
      if (housingPrefsParam === 'true') {
        console.log("Index: Redirecting to housing preferences");
        navigate("/housing-preferences", { replace: true });
      } else {
        console.log("Index: Redirecting to book page");
        navigate("/book", { replace: true });
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [navigate, location.pathname, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse">Redirecting...</div>
    </div>
  );
};

export default Index;
