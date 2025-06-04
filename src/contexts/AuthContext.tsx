import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authCleanup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Function to assign admin role to mike.ozburn@mac.com
const assignAdminRoleIfNeeded = async (user: User) => {
  if (user.email === 'mike.ozburn@mac.com') {
    try {
      // Check if user already has admin role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();

      if (!existingRole) {
        // Assign admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });

        if (error) {
          console.error('Error assigning admin role:', error);
        } else {
          console.log('Admin role assigned to mike.ozburn@mac.com');
        }
      }
    } catch (error) {
      console.error('Error checking/assigning admin role:', error);
    }
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Assign admin role if needed when user signs in
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(() => {
            assignAdminRoleIfNeeded(session.user);
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Assign admin role if needed for existing session
      if (session?.user) {
        setTimeout(() => {
          assignAdminRoleIfNeeded(session.user);
        }, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      // Force page reload for clean state
      window.location.href = '/login';
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if signOut fails, still redirect to login
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
