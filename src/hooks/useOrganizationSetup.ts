
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
      
      // Get the user's profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .eq('account_type', 'non_individual')
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        throw new Error('Failed to fetch user profile');
      }

      if (!data) {
        throw new Error('User is not an organization account');
      }

      console.log('Profile data:', data);

      // Check if provider already exists by user_id
      const { data: existingProvider } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingProvider) {
        console.log('Provider already exists for this organization');
        toast({
          title: "Organization Already Set Up",
          description: "Your organization provider profile already exists.",
        });
        return { success: true, provider_id: existingProvider.id };
      }

      // Create provider name - prioritize organization_name, fallback to representative name
      const providerName = data.organization_name || 
                          `${data.first_name} ${data.last_name}`;

      // Create representative name for contact info
      const representativeName = data.first_name && data.last_name 
        ? `${data.first_name} ${data.last_name}`
        : null;

      console.log('Creating provider with name:', providerName);
      console.log('Representative name:', representativeName);

      // Create new provider
      const { data: newProvider, error: providerError } = await supabase
        .from('providers')
        .insert({
          user_id: userId,
          name: providerName,
          provider_type: 'business',
          description: 'Organization provider account',
          capabilities: ["organization_services", "card_sharing"],
          contact_info: {
            email: data.email,
            representative: representativeName
          }
        })
        .select()
        .single();

      if (providerError) {
        console.error('Error creating provider:', providerError);
        throw providerError;
      }

      console.log('Organization provider created successfully:', newProvider);

      toast({
        title: "Organization Setup Complete",
        description: "Your organization profile has been created successfully.",
      });

      return { success: true, provider_id: newProvider.id };
    } catch (error: any) {
      console.error('Organization setup error:', error);
      toast({
        title: "Organization Setup Warning",
        description: "Your account was created successfully, but organization setup will be completed later.",
        variant: "default",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    setupOrganizationProvider,
    loading
  };
};
