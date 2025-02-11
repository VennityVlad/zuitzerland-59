
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  auth_user_id: string;
  email: string | null;
  username: string | null;
}

interface SupabaseAuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string) => Promise<void>;
  verifyOtp: (email: string, token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    if (!userId) return;
    
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingProfile) {
        setProfile(existingProfile);
        return;
      }

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: crypto.randomUUID(),
          auth_user_id: userId,
          email: user?.email || null,
          username: null,
        })
        .select()
        .maybeSingle();

      if (createError) throw createError;
      if (newProfile) {
        setProfile(newProfile);
      }
    } catch (error) {
      console.error('Error fetching/creating profile:', error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        // Only set the user if it's different from the current state
        if (JSON.stringify(session?.user) !== JSON.stringify(user)) {
          setUser(session?.user ?? null);
          if (session?.user) {
            await fetchProfile(session.user.id);
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log("Auth state change event:", event);
      
      // Only update user state if it's different
      if (JSON.stringify(session?.user) !== JSON.stringify(user)) {
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Removed user from dependencies

  const signIn = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });
      if (error) throw error;
      
      toast({
        title: "Check your email",
        description: "We've sent you a one-time code to sign in.",
      });
    } catch (error) {
      toast({
        title: "Error signing in",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      if (error) throw error;

      toast({
        title: "Success",
        description: "You've been signed in successfully.",
      });
    } catch (error) {
      toast({
        title: "Error verifying code",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // First clear any stored session data
      await supabase.auth.clearSession();
      
      // Then explicitly sign out
      const { error } = await supabase.auth.signOut({
        scope: 'local' // This ensures we clear local storage as well
      });
      
      if (error) throw error;
      
      // Force clear the user and profile states
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error) {
      toast({
        title: "Error signing out",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{ user, profile, loading, signIn, verifyOtp, signOut }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
