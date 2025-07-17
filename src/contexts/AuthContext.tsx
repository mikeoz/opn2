
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { cleanupAuthState } from '@/utils/authCleanup';
import { useOrganizationSetup } from '@/hooks/useOrganizationSetup';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  handlePostRegistrationSetup: (user: User, accountType: string) => Promise<void>;
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
  console.log('Checking if admin role needed for:', user.email);
  
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
        console.log('Assigning admin role to mike.ozburn@mac.com');
        
        // Assign admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'admin' });

        if (error) {
          console.error('Error assigning admin role:', error);
        } else {
          console.log('Admin role assigned to mike.ozburn@mac.com');
        }
      } else {
        console.log('Admin role already exists for mike.ozburn@mac.com');
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
  const { setupOrganizationProvider } = useOrganizationSetup();

  const handlePostRegistrationSetup = async (user: User, accountType: string) => {
    console.log('Post-registration setup for:', user.email, 'Account type:', accountType);
    
    // Handle admin role assignment
    setTimeout(() => {
      assignAdminRoleIfNeeded(user);
    }, 0);

    // Handle organization provider setup
    if (accountType === 'non_individual') {
      console.log('Setting up organization provider for:', user.email);
      setTimeout(() => {
        setupOrganizationProvider(user.id);
      }, 1000); // Small delay to ensure profile is created
    }
  };

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Only handle admin role assignment for existing sessions
        if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          setTimeout(() => {
            assignAdminRoleIfNeeded(session.user);
          }, 0);
        }
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session check:', session?.user?.email);
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
    handlePostRegistrationSetup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
