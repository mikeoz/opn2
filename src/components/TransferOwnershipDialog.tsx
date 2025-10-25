import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFamilyOwnershipTransfers } from '@/hooks/useFamilyOwnershipTransfers';
import { AlertCircle, Crown } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

interface TransferOwnershipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUnitId: string;
  familyUnitLabel: string;
}

const emailSchema = z.string().trim().email('Invalid email address').max(255);

export const TransferOwnershipDialog: React.FC<TransferOwnershipDialogProps> = ({
  open,
  onOpenChange,
  familyUnitId,
  familyUnitLabel
}) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { initiateTransfer } = useFamilyOwnershipTransfers(familyUnitId);

  const handleSubmit = async () => {
    try {
      emailSchema.parse(email);

      setLoading(true);
      const success = await initiateTransfer({
        familyUnitId,
        proposedOwnerEmail: email,
        message
      });

      if (success) {
        setEmail('');
        setMessage('');
        onOpenChange(false);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Transfer Family Unit Ownership
          </DialogTitle>
          <DialogDescription>
            Transfer ownership of "{familyUnitLabel}" to another person.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Once transferred, you will no longer be the trust anchor for this family unit. 
            The new owner will have full control over the family unit and its members.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="transfer-email">New Owner's Email *</Label>
            <Input
              id="transfer-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="newowner@example.com"
              maxLength={255}
            />
            <p className="text-xs text-muted-foreground mt-1">
              They will receive an email invitation to accept ownership
            </p>
          </div>

          <div>
            <Label htmlFor="transfer-message">Message (Optional)</Label>
            <Textarea
              id="transfer-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Explain why you're transferring ownership..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={loading || !email}
            >
              Send Transfer Request
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
