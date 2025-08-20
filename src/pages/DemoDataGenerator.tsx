import React from 'react';
import { DemoDataGenerator } from '@/components/DemoDataGenerator';
import MobileLayout from '@/components/MobileLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function DemoDataGeneratorPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { merchantProfile, isMerchant, loading: profileLoading } = useMerchantProfile();

  if (roleLoading || profileLoading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading...</div>
        </div>
      </MobileLayout>
    );
  }

  if (!isMerchant) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Merchant Account Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Demo data generation is only available for merchant accounts. 
                Please contact support to upgrade your account.
              </p>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Demo Data Generator</h1>
          <p className="text-muted-foreground mt-2">
            Generate realistic customer profiles and inventory data for testing your merchant account
          </p>
        </div>
        
        <DemoDataGenerator />
      </div>
    </MobileLayout>
  );
}