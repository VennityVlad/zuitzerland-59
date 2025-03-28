
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
    <div className="min-h-screen flex flex-col lg:flex-row font-trap">
      {/* Left side with image - only visible on desktop */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <img 
          src="/lovable-uploads/05a8be6e-154f-40bb-b977-f5296289f07a.png"
          alt="Zuitzerland 2025"
          className="object-cover h-full w-full"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-12 text-white">
            <h2 className="text-3xl font-light tracking-wide mb-2">ZUITZERLAND</h2>
            <p className="text-lg font-light opacity-90">Where the future meets the Alpine experience</p>
          </div>
        </div>
      </div>

      {/* Right side with form */}
      <div className="flex-1 bg-gradient-to-b from-white to-secondary/20 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Logo container - only on mobile or tablet */}
          <div className="flex justify-center mb-10 lg:hidden">
            <img 
              src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
              alt="Switzerland Logo"
              className="w-full max-w-xs"
            />
          </div>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden w-full transform transition-all hover:shadow-2xl duration-300">
            {/* Top decorative bar */}
            <div className="h-2 bg-gradient-to-r from-hotel-navy to-hotel-gold"></div>
            
            <div className="p-8">
              <p className="text-xl font-medium text-center mb-8 text-hotel-navy">
                Your Exclusive Zuitzerland 2025 Portal
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200 focus:border-hotel-navy focus:ring-hotel-navy/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-gray-50 border-gray-200 focus:border-hotel-navy focus:ring-hotel-navy/20"
                  />
                </div>

                <Button 
                  type="submit"
                  className={`w-full py-6 bg-hotel-navy hover:bg-hotel-navy/90 shadow-md hover:shadow-lg transform transition-all duration-200 ${isMobile ? 'text-lg' : ''}`}
                  disabled={isLoading}
                >
                  <LogIn className="mr-2" />
                  {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
                </Button>

                <p className="text-center text-sm text-gray-600">
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
          <div className="mt-12 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Zuitzerland. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupabaseSignIn;
