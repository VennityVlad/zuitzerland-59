
import { useState } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn } from "lucide-react";

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { signIn, user } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email);
      setIsSubmitted(true);
    } catch (error) {
      console.error("Authentication error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    window.location.href = "/";
    return null;
  }

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
              <h2 className="text-xl font-medium text-gray-900">Check your email</h2>
              <p className="text-gray-600">
                We've sent a magic link to <strong>{email}</strong>
              </p>
              <p className="text-gray-500 text-sm">
                Click the link in the email to sign in to your account.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                onClick={() => setIsSubmitted(false)}
              >
                Use a different email
              </Button>
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
                  {isLoading ? "Sending magic link..." : "Continue with email"}
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
