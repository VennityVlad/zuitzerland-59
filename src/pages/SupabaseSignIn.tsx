
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

const SupabaseSignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user } = useSupabaseAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
        navigate("/");
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    navigate("/");
    return null;
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-secondary/30 flex flex-col items-center justify-center overflow-hidden py-12">
      {/* Background pattern - visible on larger screens */}
      <div className="absolute inset-0 z-0 opacity-10 hidden md:block">
        <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-hotel-gold/30 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-hotel-navy/20 blur-3xl"></div>
      </div>
      
      <div className="container max-w-4xl mx-auto px-4 z-10 relative">
        {/* Logo container with enhanced sizing and spacing */}
        <div className="flex justify-center mb-10">
          <img 
            src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
            alt="Switzerland Logo"
            className="w-full max-w-xs md:max-w-sm"
          />
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto transform transition-all hover:scale-[1.01] duration-300">
          {/* Top decorative bar */}
          <div className="h-2 bg-gradient-to-r from-hotel-navy to-hotel-gold"></div>
          
          <div className="p-8 md:p-10">
            <p className="text-gray-600 mb-8 text-center text-lg md:text-xl font-trap">
              Your exclusive portal to Zuitzerland 2025
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="font-trap">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-200 focus:border-hotel-navy focus:ring-hotel-navy/20 font-trap"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-trap">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-gray-50 border-gray-200 focus:border-hotel-navy focus:ring-hotel-navy/20 font-trap"
                />
              </div>

              <Button 
                type="submit"
                className={`w-full py-6 bg-hotel-navy hover:bg-hotel-navy/90 shadow-md hover:shadow-lg transform transition-all duration-200 font-trap ${isMobile ? 'text-lg' : ''}`}
                disabled={isLoading}
              >
                <LogIn className="mr-2" />
                {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
              </Button>

              <p className="text-center text-sm text-gray-600 font-trap">
                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-hotel-navy hover:underline font-medium"
                >
                  {isSignUp ? "Sign In" : "Sign Up"}
                </button>
              </p>
            </form>
          </div>
        </div>

        {/* Footer attribution */}
        <div className="mt-12 text-center text-xs text-gray-500 font-trap">
          <p>© {new Date().getFullYear()} Zuitzerland. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSignIn;
