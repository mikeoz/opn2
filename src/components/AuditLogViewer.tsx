import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, FileText, Shield } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  table_name: string;
  operation: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  user_id: string | null;
  timestamp: string;
  ip_address: unknown;
  user_agent: string | null;
}

export const AuditLogViewer = () => {
  const { isAdmin, loading } = useUserRole();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Only show to admins
  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return null;

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLogsLoading(false);
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'ADMIN_ROLE_ASSIGNED':
        return 'bg-green-100 text-green-800';
      case 'ADMIN_ROLE_REVOKED':
        return 'bg-red-100 text-red-800';
      case 'INSERT':
        return 'bg-blue-100 text-blue-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLogEntry = (log: AuditLog) => {
    if (log.operation.includes('ADMIN_ROLE')) {
      const action = log.operation.includes('ASSIGNED') ? 'assigned' : 'revoked';
      const targetUser = log.new_values?.assigned_by || log.new_values?.revoked_by || 'Unknown';
      return `Admin role ${action} for user ${log.record_id} by ${targetUser}`;
    }
    
    return `${log.operation} on ${log.table_name}`;
  };

  if (logsLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          Loading audit logs...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Security Audit Log
          <Badge variant="secondary" className="ml-auto">
            {auditLogs.length} entries
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {auditLogs.length === 0 ? (
            <div className="flex items-center justify-center p-6 text-muted-foreground">
              <AlertCircle className="h-4 w-4 mr-2" />
              No audit logs found
            </div>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log, index) => (
                <div key={log.id}>
                  <div className="flex items-start gap-3 p-3 rounded-lg border">
                    <Shield className="h-4 w-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge className={getOperationColor(log.operation)}>
                          {log.operation}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(log.timestamp), 'MMM dd, yyyy HH:mm:ss')}
                        </span>
                      </div>
                      <p className="text-sm">{formatLogEntry(log)}</p>
                      <div className="text-xs text-muted-foreground">
                        Table: {log.table_name} | User: {log.user_id}
                        {log.ip_address && ` | IP: ${log.ip_address}`}
                      </div>
                    </div>
                  </div>
                  {index < auditLogs.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};