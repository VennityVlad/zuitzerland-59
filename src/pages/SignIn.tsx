
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { signIn, verifyOtp, user } = useSupabaseAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("SignIn: user state changed", user);
    if (user) {
      console.log("SignIn: navigating to /");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!isSubmitted) {
        await signIn(email);
        setIsSubmitted(true);
      } else {
        console.log("SignIn: verifying OTP");
        await verifyOtp(email, otp);
        console.log("SignIn: OTP verified successfully");
      }
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <img 
          src="/lovable-uploads/2796594c-9800-4554-b79d-a1da8992c369.png"
          alt="Switzerland Logo"
          className="logo"
        />
        
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <h1 className="text-2xl font-semibold text-hotel-navy mb-6 text-center">
            Welcome to Switzerland Booking Portal
          </h1>
          
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <h2 className="text-xl font-medium text-gray-900">Enter verification code</h2>
              <p className="text-gray-600">
                We've sent a code to <strong>{email}</strong>
              </p>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="otp">Verification code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    className="text-center text-lg letter-spacing-1"
                    maxLength={6}
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full py-6 bg-hotel-navy hover:bg-hotel-navy/90"
                  disabled={isLoading}
                >
                  <LogIn className="mr-2" />
                  {isLoading ? "Verifying..." : "Verify and sign in"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    setOtp("");
                  }}
                >
                  Use a different email
                </Button>
              </form>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-8 text-center">
                Enter your email to sign in or create an account
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  className="w-full py-6 bg-hotel-navy hover:bg-hotel-navy/90"
                  disabled={isLoading}
                >
                  <LogIn className="mr-2" />
                  {isLoading ? "Sending code..." : "Continue with email"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;
