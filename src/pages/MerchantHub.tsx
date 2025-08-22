import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  QrCode, 
  Users, 
  BarChart3, 
  Zap, 
  Settings,
  Scan,
  Gift
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { useMerchantQRCodes } from '@/hooks/useMerchantQRCodes';
import { useMerchantCustomers } from '@/hooks/useMerchantCustomers';
import MobileLayout from '@/components/MobileLayout';
import MerchantQRManager from '@/components/MerchantQRManager';
import QRScanner from '@/components/QRScanner';
import MerchantAnalyticsDashboard from '@/components/MerchantAnalyticsDashboard';
import CustomerInvitationManager from '@/components/CustomerInvitationManager';
import LoyaltyProgramManager from '@/components/LoyaltyProgramManager';
import MerchantOnboardingWizard from '@/components/MerchantOnboardingWizard';

export default function MerchantHub() {
  const { merchantProfile, isMerchant, loading: profileLoading } = useMerchantProfile();
  const { qrCodes, totalScans, activeCodes } = useMerchantQRCodes();
  const { totalCustomers } = useMerchantCustomers(merchantProfile?.id);

  if (profileLoading) {
    return (
      <MobileLayout>
        <div className="p-4">
          <div className="text-center">Loading merchant profile...</div>
        </div>
      </MobileLayout>
    );
  }

  if (!isMerchant) {
    return (
      <MobileLayout>
        <div className="p-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Merchant Hub
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You need a merchant account to access the Merchant Hub. 
                Please create an organization account to get started.
              </p>
              <Button asChild>
                <Link to="/register">Create Merchant Account</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Merchant Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              {merchantProfile?.user_profile?.organization_name || merchantProfile?.name || 'Merchant Hub'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <div className="text-xs text-muted-foreground">Customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{totalScans}</div>
                <div className="text-xs text-muted-foreground">QR Scans</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{activeCodes}</div>
                <div className="text-xs text-muted-foreground">Active QRs</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Mode Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <h3 className="font-semibold text-blue-900 mb-2">🚀 Opn.li Loyal (Reverse-Loyalty) System</h3>
            <p className="text-sm text-blue-800 mb-3">
              This is your merchant dashboard for the revolutionary reverse-loyalty system. 
              Customers invite YOU to show your loyalty to them!
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
              <div>✅ QR Code Generation</div>
              <div>✅ Customer Analytics</div>
              <div>✅ Loyalty Programs</div>
              <div>✅ Mobile Scanning</div>
            </div>
          </CardContent>
        </Card>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-20 flex-col" onClick={() => {
                const toolsTab = document.querySelector('[value="tools"]') as HTMLButtonElement;
                toolsTab?.click();
                setTimeout(() => {
                  const qrTab = document.querySelector('[value="qr-codes"]') as HTMLButtonElement;
                  qrTab?.click();
                }, 100);
              }}>
                <QrCode className="h-6 w-6 mb-2" />
                <span className="text-sm">Manage QR Codes</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => {
                const toolsTab = document.querySelector('[value="tools"]') as HTMLButtonElement;
                toolsTab?.click();
                setTimeout(() => {
                  const scannerTab = document.querySelector('[value="scanner"]') as HTMLButtonElement;
                  scannerTab?.click();
                }, 100);
              }}>
                <Scan className="h-6 w-6 mb-2" />
                <span className="text-sm">Test Scanner</span>
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-20 flex-col" onClick={() => {
                const toolsTab = document.querySelector('[value="tools"]') as HTMLButtonElement;
                toolsTab?.click();
                setTimeout(() => {
                  const loyaltyTab = document.querySelector('[value="loyalty"]') as HTMLButtonElement;
                  loyaltyTab?.click();
                }, 100);
              }}>
                <Zap className="h-6 w-6 mb-2" />
                <span className="text-sm">Loyalty Program</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col" onClick={() => {
                const toolsTab = document.querySelector('[value="tools"]') as HTMLButtonElement;
                toolsTab?.click();
                setTimeout(() => {
                  const analyticsTab = document.querySelector('[value="analytics"]') as HTMLButtonElement;
                  analyticsTab?.click();
                }, 100);
              }}>
                <BarChart3 className="h-6 w-6 mb-2" />
                <span className="text-sm">Analytics</span>
              </Button>
            </div>

            {/* Recent QR Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent QR Codes</CardTitle>
              </CardHeader>
              <CardContent>
                {qrCodes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No QR codes created yet. Create your first QR code to get started!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {qrCodes.slice(0, 3).map((qr) => (
                      <div key={qr.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{qr.display_name}</div>
                          <div className="text-sm text-muted-foreground">{qr.qr_type}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{qr.scan_count} scans</div>
                          <Badge variant={qr.is_active ? "default" : "secondary"} className="text-xs">
                            {qr.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tools" className="space-y-4">
            <Tabs defaultValue="qr-codes" orientation="vertical">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="qr-codes" className="text-xs">QR Codes</TabsTrigger>
                <TabsTrigger value="scanner" className="text-xs">Scanner</TabsTrigger>
                <TabsTrigger value="loyalty" className="text-xs">Loyalty</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs">Analytics</TabsTrigger>
                <TabsTrigger value="setup" className="text-xs">Setup</TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr-codes">
                <MerchantQRManager />
              </TabsContent>
              
              <TabsContent value="scanner">
                <QRScanner />
              </TabsContent>
              
              <TabsContent value="loyalty">
                <LoyaltyProgramManager />
              </TabsContent>
              
              <TabsContent value="analytics">
                <MerchantAnalyticsDashboard />
              </TabsContent>
              
              <TabsContent value="setup">
                <MerchantOnboardingWizard />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </MobileLayout>
  );
}