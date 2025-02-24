
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import type { User } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

interface UserRoles {
  admin: boolean;
  coDesigner: boolean;
  coCurator: boolean;
}

interface SupabaseAuthContextType {
  user: User | null;
  loading: boolean;
  roles: UserRoles;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkRole: (role: 'admin' | 'co-designer' | 'co-curator') => Promise<boolean>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRoles>({
    admin: false,
    coDesigner: false,
    coCurator: false,
  });
  const { toast } = useToast();

  const checkRole = async (role: 'admin' | 'co-designer' | 'co-curator'): Promise<boolean> => {
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('has_role', {
          user_id: user.id,
          role: role
        });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  };

  const updateRoles = async (userId: string) => {
    const roleChecks = await Promise.all([
      checkRole('admin'),
      checkRole('co-designer'),
      checkRole('co-curator'),
    ]);

    setRoles({
      admin: roleChecks[0],
      coDesigner: roleChecks[1],
      coCurator: roleChecks[2],
    });
  };

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await updateRoles(session.user.id);
      }
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await updateRoles(session.user.id);
      } else {
        setRoles({ admin: false, coDesigner: false, coCurator: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      toast({
        title: "Error signing in",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });
      if (error) throw error;
      
      toast({
        title: "Sign up successful",
        description: "Please check your email to verify your account.",
      });
    } catch (error) {
      toast({
        title: "Error signing up",
        description: (error as Error).message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
    <SupabaseAuthContext.Provider value={{ 
      user, 
      loading, 
      roles,
      signIn, 
      signUp, 
      signOut,
      checkRole
    }}>
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
