
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useOrganizationSetup = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const setupOrganizationProvider = async (userId: string) => {
    setLoading(true);
    try {
      console.log('Setting up organization provider for user:', userId);
      
      const { data, error } = await supabase.rpc('setup_organization_provider', {
        user_id: userId
      });

      if (error) {
        console.error('Error setting up organization provider:', error);
        throw error;
      }

      console.log('Organization setup result:', data);

      if (data && !data.success) {
        throw new Error(data.error || 'Failed to setup organization provider');
      }

      toast({
        title: "Organization Setup Complete",
        description: "Your organization profile has been created successfully.",
      });

      return data;
    } catch (error: any) {
      console.error('Organization setup error:', error);
      toast({
        title: "Organization Setup Warning",
        description: "Your account was created successfully, but organization setup will be completed later.",
        variant: "default",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    setupOrganizationProvider,
    loading
  };
};
