
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

const SupabaseSignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const { signIn, signUp, user } = useSupabaseAuth();
  const navigate = useNavigate();

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
    <div 
      className="min-h-screen relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/lovable-uploads/d74a7f50-2043-4469-b19f-85dd74e411a5.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* Overlay to ensure text readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black/30"
        style={{ backdropFilter: 'blur(2px)' }}
      />

      <div className="container max-w-4xl mx-auto relative z-10">
        <div className="mb-8 bg-white/90 p-4 rounded-xl inline-block backdrop-blur-sm">
          <img 
            src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
            alt="Switzerland Logo"
            className="h-24 w-auto"
          />
        </div>
        
        <div className="bg-white/90 backdrop-blur-md rounded-lg shadow-2xl p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-hotel-navy mb-6 text-center">
            Welcome to Switzerland Booking Portal
          </h1>
          
          <p className="text-gray-600 mb-8 text-center">
            Please sign {isSignUp ? 'up' : 'in'} to access the booking form
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/80 border-gray-300 focus:border-hotel-navy focus:ring-hotel-navy"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white/80 border-gray-300 focus:border-hotel-navy focus:ring-hotel-navy"
              />
            </div>

            <Button 
              type="submit"
              className="w-full py-6 bg-hotel-navy hover:bg-hotel-navy/90 transition-colors duration-200"
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
    </div>
  );
};

export default SupabaseSignIn;
