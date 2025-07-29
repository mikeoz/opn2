import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { emailSchema, adminOperationLimiter } from '@/utils/inputValidation';
import { AlertTriangle, Shield, UserPlus, UserMinus } from 'lucide-react';

export const AdminManagement = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useUserRole();
  const { toast } = useToast();
  const [targetEmail, setTargetEmail] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);

  // Only show to admins
  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return null;

  const handleAdminOperation = async (operation: 'assign' | 'revoke') => {
    if (!user) return;

    // Rate limiting check
    const rateLimitKey = `admin-op-${user.id}`;
    if (!adminOperationLimiter.canAttempt(rateLimitKey)) {
      const remainingTime = adminOperationLimiter.getRemainingTime(rateLimitKey);
      const minutes = Math.ceil(remainingTime / 60000);
      toast({
        title: "Rate limit exceeded",
        description: `Please wait ${minutes} minutes before attempting admin operations again`,
        variant: "destructive",
      });
      return;
    }

    // Validate email
    const emailValidation = emailSchema.safeParse(targetEmail);
    if (!emailValidation.success) {
      toast({
        title: "Invalid email",
        description: emailValidation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setOperationLoading(true);

    try {
      // Find target user by email
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', targetEmail)
        .single();

      if (profileError || !profileData) {
        toast({
          title: "User not found",
          description: "No user found with that email address",
          variant: "destructive",
        });
        return;
      }

      // Prevent self-revocation
      if (operation === 'revoke' && profileData.id === user.id) {
        toast({
          title: "Operation not allowed",
          description: "You cannot revoke your own admin role",
          variant: "destructive",
        });
        return;
      }

      // Call the appropriate secure function
      const functionName = operation === 'assign' ? 'assign_admin_role' : 'revoke_admin_role';
      const { error } = await supabase.rpc(functionName, {
        target_user_id: profileData.id
      });

      if (error) {
        toast({
          title: "Operation failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: `Admin role ${operation === 'assign' ? 'assigned to' : 'revoked from'} ${targetEmail}`,
      });

      setTargetEmail(''); // Clear form
    } catch (error: any) {
      console.error(`Error ${operation}ing admin role:`, error);
      toast({
        title: "Unexpected error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOperationLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Admin Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Admin operations are logged and rate-limited for security. Use responsibly.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="target-email">User Email</Label>
          <Input
            id="target-email"
            type="email"
            placeholder="user@example.com"
            value={targetEmail}
            onChange={(e) => setTargetEmail(e.target.value)}
            disabled={operationLoading}
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => handleAdminOperation('assign')}
            disabled={operationLoading || !targetEmail.trim()}
            className="flex-1"
            variant="default"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Assign Admin
          </Button>
          
          <Button
            onClick={() => handleAdminOperation('revoke')}
            disabled={operationLoading || !targetEmail.trim()}
            className="flex-1"
            variant="destructive"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Revoke Admin
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          All admin role changes are audited and logged for security purposes.
        </div>
      </CardContent>
    </Card>
  );
};