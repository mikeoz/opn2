import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, Scan, CheckCircle, XCircle, Store, Gift, Zap, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MerchantInfo {
  id: string;
  name: string;
  logo_url?: string;
  organization_name?: string;
  qr_type: string;
  description?: string;
  metadata: any;
}

const QRTypeIcons = {
  store_entry: Store,
  loyalty_program: Zap,
  special_offer: Gift,
  event_checkin: Calendar,
};

export default function QRScanner() {
  const { user } = useAuth();
  const [scanning, setScanning] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState<MerchantInfo | null>(null);
  const [scanResult, setScanResult] = useState<'success' | 'error' | null>(null);
  const [demoMode, setDemoMode] = useState(true);
  const [manualUrl, setManualUrl] = useState('');

  // Demo QR codes for testing
  const demoQRCodes = [
    {
      id: 'demo-1',
      name: 'Coffee Shop Loyalty',
      qr_type: 'loyalty_program',
      description: 'Earn 10 points for every visit!',
      metadata: { loyalty_points: 10 }
    },
    {
      id: 'demo-2', 
      name: 'Restaurant Check-in',
      qr_type: 'store_entry',
      description: 'Welcome to our restaurant!',
      metadata: {}
    },
    {
      id: 'demo-3',
      name: 'Special 20% Off',
      qr_type: 'special_offer',
      description: 'Limited time offer - 20% off all items',
      metadata: { discount_percentage: 20 }
    }
  ];

  const handleDemoScan = (demoQR: any) => {
    setScanning(true);
    
    // Simulate scanning delay
    setTimeout(() => {
      setMerchantInfo({
        id: demoQR.id,
        name: demoQR.name,
        organization_name: demoQR.name,
        qr_type: demoQR.qr_type,
        description: demoQR.description,
        metadata: demoQR.metadata
      });
      setScanResult('success');
      setScanning(false);
    }, 1500);
  };

  const processQRScan = async (qrData: string) => {
    try {
      // In demo mode, simulate processing
      if (demoMode) {
        toast.success('Demo scan processed successfully!');
        return;
      }

      // Parse QR code data to extract merchant and QR code info
      const urlPattern = /\/scan\/([^\/]+)\/([^\/]+)\/([^\/]+)/;
      const match = qrData.match(urlPattern);
      
      if (!match) {
        throw new Error('Invalid QR code format');
      }

      const [, merchantId, qrType, qrToken] = match;

      // Look up QR code and merchant info
      const { data: qrCode, error: qrError } = await supabase
        .from('merchant_qr_codes')
        .select(`
          id,
          merchant_id,
          qr_type,
          description,
          metadata,
          is_active,
          expires_at,
          providers!merchant_qr_codes_merchant_id_fkey (
            name,
            user_id,
            profiles!providers_user_id_fkey (
              organization_name,
              logo_url
            )
          )
        `)
        .eq('merchant_id', merchantId)
        .eq('qr_type', qrType)
        .eq('is_active', true)
        .single();

      if (qrError || !qrCode) {
        throw new Error('QR code not found or inactive');
      }

      // Check expiration
      if (qrCode.expires_at && new Date(qrCode.expires_at) < new Date()) {
        throw new Error('QR code has expired');
      }

      // Log the interaction
      if (user) {
        await supabase.rpc('log_merchant_interaction', {
          p_user_id: user.id,
          p_merchant_id: merchantId,
          p_interaction_type: qrCode.qr_type,
          p_interaction_data: {
            qr_code_id: qrCode.id,
            scan_timestamp: new Date().toISOString()
          },
          p_qr_code_id: qrCode.id
        });
      }

      setScanResult('success');
      toast.success('QR code scanned successfully!');
      
    } catch (error: any) {
      console.error('QR scan error:', error);
      setScanResult('error');
      toast.error(error.message || 'Failed to process QR code');
    }
  };

  const handleJoinLoyalty = async () => {
    if (!merchantInfo || !user) return;

    try {
      // In demo mode, just show success
      if (demoMode) {
        toast.success('Demo: Joined loyalty program successfully!');
        return;
      }

      // Create customer relationship
      const { error } = await supabase
        .from('user_provider_relationships')
        .insert({
          user_id: user.id,
          provider_id: merchantInfo.id,
          relationship_type: 'customer',
          status: 'active',
          access_permissions: {
            loyalty_program: true,
            notifications: true
          }
        });

      if (error) throw error;

      toast.success('Successfully joined loyalty program!');
      setMerchantInfo(null);
      setScanResult(null);
    } catch (error: any) {
      console.error('Error joining loyalty program:', error);
      toast.error('Failed to join loyalty program');
    }
  };

  const startCamera = async () => {
    setScanning(true);
    
    // In demo mode, show demo interface
    if (demoMode) {
      toast.info('Demo mode: Select a demo QR code below to simulate scanning');
      setScanning(false);
      return;
    }

    // Real camera implementation would go here
    toast.info('Camera scanning not implemented in demo');
    setScanning(false);
  };

  const IconComponent = merchantInfo ? QRTypeIcons[merchantInfo.qr_type as keyof typeof QRTypeIcons] || Scan : Scan;

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Camera className="h-6 w-6" />
            QR Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Demo Mode Toggle */}
          <Alert>
            <AlertDescription>
              <strong>Demo Mode:</strong> In Alpha Testing, this will use your device camera to scan real QR codes. For now, use the demo codes below.
            </AlertDescription>
          </Alert>

          {/* Scanning Interface */}
          {!merchantInfo && !scanning && (
            <div className="text-center space-y-4">
              <div className="w-48 h-48 mx-auto border-2 border-dashed border-muted-foreground rounded-lg flex items-center justify-center">
                <Scan className="h-16 w-16 text-muted-foreground" />
              </div>
              <Button onClick={startCamera} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Start Scanning
              </Button>
            </div>
          )}

          {/* Scanning State */}
          {scanning && (
            <div className="text-center space-y-4">
              <div className="w-48 h-48 mx-auto border-2 border-primary rounded-lg flex items-center justify-center animate-pulse">
                <Scan className="h-16 w-16 text-primary animate-spin" />
              </div>
              <p className="text-muted-foreground">Scanning for QR codes...</p>
            </div>
          )}

          {/* Merchant Info */}
          {merchantInfo && (
            <Card className="border-primary">
              <CardHeader className="text-center pb-3">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <IconComponent className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{merchantInfo.organization_name || merchantInfo.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-center text-muted-foreground">{merchantInfo.description}</p>
                
                {merchantInfo.qr_type === 'loyalty_program' && (
                  <div className="text-center">
                    <Badge className="mb-3">
                      +{merchantInfo.metadata.loyalty_points || 0} Points
                    </Badge>
                    <p className="text-sm text-muted-foreground">Join our loyalty program and earn points!</p>
                  </div>
                )}

                {merchantInfo.qr_type === 'special_offer' && (
                  <div className="text-center">
                    <Badge variant="secondary" className="mb-3">
                      {merchantInfo.metadata.discount_percentage}% OFF
                    </Badge>
                    <p className="text-sm text-muted-foreground">Special discount available!</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={handleJoinLoyalty} 
                    className="flex-1"
                    disabled={!user}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {merchantInfo.qr_type === 'loyalty_program' ? 'Join Program' : 'Accept Offer'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setMerchantInfo(null);
                      setScanResult(null);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>

                {!user && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please log in to join loyalty programs
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Demo QR Codes */}
      {demoMode && !merchantInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demo QR Codes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoQRCodes.map((demo, index) => {
              const IconComponent = QRTypeIcons[demo.qr_type as keyof typeof QRTypeIcons];
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full justify-start h-auto p-3"
                  onClick={() => handleDemoScan(demo)}
                  disabled={scanning}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="h-5 w-5" />
                    <div className="text-left">
                      <div className="font-medium">{demo.name}</div>
                      <div className="text-sm text-muted-foreground">{demo.description}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}