import { BulkImportManager } from '@/components/BulkImportManager';
import MobileLayout from '@/components/MobileLayout';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function BulkImport() {
  const { isAdmin, loading } = useUserRole();

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading...</div>
        </div>
      </MobileLayout>
    );
  }

  if (!isAdmin) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p>You need admin privileges to access the Bulk Import Manager.</p>
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
          <h1 className="text-3xl font-bold">Bulk Import Manager</h1>
          <p className="text-muted-foreground mt-2">
            Import multiple cards using CSV templates
          </p>
        </div>
        
        <BulkImportManager />
      </div>
    </MobileLayout>
  );
}