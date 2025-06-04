
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      console.log('Checking admin role for user:', user.email);

      try {
        // First check if admin role exists
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking admin role:', error);
        }

        const hasAdminRole = !!data;
        console.log('Admin role check result:', hasAdminRole);

        // If user is mike.ozburn@mac.com and doesn't have admin role, assign it
        if (user.email === 'mike.ozburn@mac.com' && !hasAdminRole) {
          console.log('Assigning admin role to mike.ozburn@mac.com');
          
          const { error: insertError } = await supabase
            .from('user_roles')
            .insert({ user_id: user.id, role: 'admin' });

          if (insertError) {
            console.error('Error assigning admin role:', insertError);
          } else {
            console.log('Admin role successfully assigned');
            setIsAdmin(true);
          }
        } else {
          setIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.error('Error in checkAdminRole:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminRole();
  }, [user]);

  const assignAdminRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });

      if (error) throw error;
      
      // Refresh the admin status
      if (user?.id === userId) {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error assigning admin role:', error);
      throw error;
    }
  };

  return { isAdmin, loading, assignAdminRole };
};
