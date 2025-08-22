
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Clock, Users, QrCode, Store, BarChart3, FileText, Upload, Activity, TreePine } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useRecentActivity } from '@/hooks/useRecentActivity';
import { useMerchantQRCodes } from '@/hooks/useMerchantQRCodes';
import { useMerchantCustomers } from '@/hooks/useMerchantCustomers';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import MobileLayout from '@/components/MobileLayout';

const Dashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  
  // Merchant-focused data hooks
  const { activities, loading: activityLoading, hasActivity } = useRecentActivity();
  const { qrCodes, totalScans, activeCodes, loading: qrLoading } = useMerchantQRCodes();
  const { customers, totalCustomers, recentCustomers, formatTimeAgo, loading: customerLoading } = useMerchantCustomers();
  const { merchantProfile, isMerchant, loading: profileLoading } = useMerchantProfile();

  console.log('Dashboard - User:', user?.email, 'isAdmin:', isAdmin, 'isMerchant:', isMerchant);

  // Show different dashboard based on user type
  if (!isMerchant) {
    return (
      <MobileLayout>
        <div className="p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Individual Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You have an individual account. The Reverse Loyalty system features are designed for merchant accounts.
              </p>
              <p className="text-sm text-muted-foreground">
                To access merchant features like QR codes and customer management, you'll need a merchant/organization account.
              </p>
            </CardContent>
          </Card>
          
          {/* Help & Resources Section */}
          <div className="pt-6 border-t border-border">
            <h2 className="text-lg font-semibold text-muted-foreground mb-4">Help & Resources</h2>
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/family-management">
                  <TreePine className="h-4 w-4 mr-2" />
                  Family Management
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/user-guide">
                  <FileText className="h-4 w-4 mr-2" />
                  User Guide
                </Link>
              </Button>
            </div>
          </div>

          {/* Admin Section */}
          {isAdmin && (
            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-semibold text-muted-foreground mb-4">Administrator Tools</h2>
              <div className="space-y-2">
                <Button asChild className="w-full bg-primary hover:bg-primary/90">
                  <Link to="/admin/cards">
                    <Settings className="h-4 w-4 mr-2" />
                    Manage AdminCARDs
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/admin/bulk-import">
                    <Upload className="h-4 w-4 mr-2" />
                    Bulk Import Manager
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="p-4 space-y-6">
        {/* Merchant Overview */}
        {merchantProfile && (
          <Card className="bg-gradient-to-br from-background to-muted/30 border-benefit/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-benefit">
                <Store className="h-5 w-5" />
                {merchantProfile.user_profile?.organization_name || merchantProfile.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-benefit/5 border border-benefit/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Customers</p>
                  <p className="text-2xl font-bold text-benefit">{totalCustomers}</p>
                </div>
                <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Total QR Scans</p>
                  <p className="text-2xl font-bold text-accent">{totalScans}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Customer Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activityLoading ? (
                <p className="text-sm text-muted-foreground">Loading activity...</p>
              ) : !hasActivity ? (
                <p className="text-sm text-muted-foreground">No recent activity</p>
              ) : (
                activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'share' ? 'bg-primary' :
                      activity.type === 'receive' ? 'bg-accent' :
                      activity.type === 'create' ? 'bg-green-500' :
                      activity.type === 'update' ? 'bg-yellow-500' :
                      activity.type === 'scan' ? 'bg-purple-500' :
                      'bg-blue-500'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active QR Codes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              QR Codes
              <Badge variant="secondary">{activeCodes} Active</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {qrLoading ? (
                <p className="text-sm text-muted-foreground">Loading QR codes...</p>
              ) : qrCodes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No QR codes created yet</p>
              ) : (
                qrCodes.slice(0, 3).map((code) => (
                  <div key={code.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{code.display_name || `${code.qr_type} QR Code`}</p>
                      <p className="text-xs text-muted-foreground">{code.description || 'No description'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{code.scan_count} scans</p>
                      <Badge variant={code.is_active ? "default" : "secondary"} className="text-xs">
                        {code.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Customers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Customers
              <Badge variant="secondary">{totalCustomers} Total</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customerLoading ? (
                <p className="text-sm text-muted-foreground">Loading customers...</p>
              ) : recentCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No customers yet</p>
              ) : (
                recentCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                       <p className="font-medium">
                         {customer.customer_name || 'Unknown Customer'}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {customer.last_interaction_at 
                           ? `Last active: ${formatTimeAgo(customer.last_interaction_at)}`
                           : 'No recent activity'}
                       </p>
                     </div>
                     <div className="text-right">
                       <Badge variant="outline" className="text-xs">
                         {customer.customer_status}
                       </Badge>
                       <p className="text-xs text-muted-foreground mt-1">
                         {customer.total_interactions || 0} interactions
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help & Resources Section - Available to all users */}
        <div className="pt-6 border-t border-border">
          <h2 className="text-lg font-semibold text-muted-foreground mb-4">Help & Resources</h2>
          <div className="space-y-2">
            <Button asChild variant="outline" className="w-full">
              <Link to="/family-management">
                <TreePine className="h-4 w-4 mr-2" />
                Family Management
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link to="/user-guide">
                <FileText className="h-4 w-4 mr-2" />
                User Guide
              </Link>
            </Button>
          </div>
        </div>

        {/* Admin Section - At bottom of scroll */}
        {isAdmin && (
          <div className="pt-6 border-t border-border">
            <h2 className="text-lg font-semibold text-muted-foreground mb-4">Administrator Tools</h2>
            <div className="space-y-2">
              <Button asChild className="w-full bg-primary hover:bg-primary/90">
                <Link to="/admin/cards">
                  <Settings className="h-4 w-4 mr-2" />
                  Manage AdminCARDs
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link to="/admin/bulk-import">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import Manager
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default Dashboard;
