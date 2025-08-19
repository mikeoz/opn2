import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface QRCodeData {
  id: string;
  display_name: string;
  description: string | null;
  qr_type: string;
  scan_count: number;
  is_active: boolean;
  created_at: string;
  expires_at: string | null;
}

export const useMerchantQRCodes = () => {
  const [qrCodes, setQrCodes] = useState<QRCodeData[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const fetchQRCodes = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // First get the user's provider/merchant ID
      const { data: provider, error: providerError } = await supabase
        .from('providers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (providerError || !provider) {
        setQrCodes([]);
        return;
      }

      // Then get QR codes for this merchant
      const { data: codes, error } = await supabase
        .from('merchant_qr_codes')
        .select(`
          id,
          display_name,
          description,
          qr_type,
          scan_count,
          is_active,
          created_at,
          expires_at
        `)
        .eq('merchant_id', provider.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setQrCodes(codes || []);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
      toast.error('Failed to load QR codes');
      setQrCodes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQRCodes();
  }, [user]);

  return {
    qrCodes,
    loading,
    refetch: fetchQRCodes,
    totalScans: qrCodes.reduce((total, code) => total + code.scan_count, 0),
    activeCodes: qrCodes.filter(code => code.is_active).length
  };
};