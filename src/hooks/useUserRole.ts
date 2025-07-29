
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
        // Check if admin role exists using the has_role function
        const { data, error } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) {
          console.error('Error checking admin role with function:', error);
          
          // Fallback to direct query
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .single();

          if (roleError && roleError.code !== 'PGRST116') {
            console.error('Error with fallback admin role check:', roleError);
          }

          const hasAdminRole = !!roleData;
          console.log('Fallback admin role check result:', hasAdminRole);

          setIsAdmin(hasAdminRole);
        } else {
          console.log('has_role function result:', data);
          setIsAdmin(data === true);
          
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
      const { data, error } = await supabase.rpc('assign_admin_role', {
        target_user_id: userId
      });

      if (error) throw error;
      
      // Refresh the admin status
      if (user?.id === userId) {
        setIsAdmin(true);
      }
      
      return data;
    } catch (error) {
      console.error('Error assigning admin role:', error);
      throw error;
    }
  };

  return { isAdmin, loading, assignAdminRole };
};
