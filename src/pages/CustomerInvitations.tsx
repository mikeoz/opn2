import MobileLayout from '@/components/MobileLayout';
import CustomerInvitationManager from '@/components/CustomerInvitationManager';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomerInvitations } from '@/hooks/useCustomerInvitations';
import { Mail, Users, CheckCircle, Clock, TrendingUp } from 'lucide-react';

export default function CustomerInvitations() {
  const { stats, loading } = useCustomerInvitations();

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Invitations</CardTitle>
              <Mail className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sent</CardTitle>
              <Users className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.sent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accepted</CardTitle>
              <CheckCircle className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '...' : stats.accepted}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 ml-auto text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : `${stats.conversionRate.toFixed(1)}%`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status Breakdown */}
        {!loading && stats.total > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Invitation Status Breakdown</CardTitle>
              <CardDescription>Current status of all your invitations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {stats.pending > 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Pending: {stats.pending}
                  </Badge>
                )}
                {stats.sent > 0 && (
                  <Badge variant="default" className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    Sent: {stats.sent}
                  </Badge>
                )}
                {stats.accepted > 0 && (
                  <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3" />
                    Accepted: {stats.accepted}
                  </Badge>
                )}
                {stats.expired > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expired: {stats.expired}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Invitation Manager */}
        <CustomerInvitationManager />
      </div>
    </MobileLayout>
  );
}