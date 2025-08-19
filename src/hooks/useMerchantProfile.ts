import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MerchantProfile {
  id: string;
  name: string;
  description: string | null;
  provider_type: string;
  capabilities: any;
  contact_info: any;
  created_at: string;
  user_profile?: {
    organization_name?: string;
    logo_url?: string;
    account_type: string;
  };
}

export const useMerchantProfile = () => {
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchMerchantProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get the user's provider/merchant profile
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select(`
          id,
          name,
          description,
          provider_type,
          capabilities,
          contact_info,
          created_at
        `)
        .eq('user_id', user.id)
        .single();

      if (providerError) {
        if (providerError.code === 'PGRST116') {
          // No provider profile found - user is not a merchant
          setMerchantProfile(null);
          return;
        }
        throw providerError;
      }

      // Get the user's profile info
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_name, logo_url, account_type')
        .eq('id', user.id)
        .single();

      const merchantData: MerchantProfile = {
        ...provider,
        user_profile: userProfile
      };

      setMerchantProfile(merchantData);
    } catch (error) {
      console.error('Error fetching merchant profile:', error);
      toast.error('Failed to load merchant profile');
      setMerchantProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMerchantProfile();
  }, [user]);

  return {
    merchantProfile,
    loading,
    refetch: fetchMerchantProfile,
    isMerchant: !!merchantProfile
  };
};