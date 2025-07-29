import React from 'react';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminManagement } from '@/components/AdminManagement';
import { AuditLogViewer } from '@/components/AuditLogViewer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Lock, Eye } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function SecurityDashboard() {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Security Dashboard</h1>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          This dashboard provides administrative security functions. All actions are logged and monitored.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-green-800 font-medium">RLS Enabled</div>
                <div className="text-green-600 text-sm">Row Level Security is active</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-green-800 font-medium">Secure Functions</div>
                <div className="text-green-600 text-sm">Admin functions are protected</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-green-800 font-medium">Audit Logging</div>
                <div className="text-green-600 text-sm">All actions are logged</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-green-800 font-medium">Rate Limiting</div>
                <div className="text-green-600 text-sm">Admin operations are rate limited</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Management */}
        <AdminManagement />
      </div>

      {/* Audit Log Viewer */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          <h2 className="text-xl font-semibold">Security Audit Trail</h2>
        </div>
        <AuditLogViewer />
      </div>
    </div>
  );
}