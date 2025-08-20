import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Send, X } from 'lucide-react';
import { useFamilyInvitations, CreateInvitationData } from '@/hooks/useFamilyInvitations';

interface FamilyInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUnitId: string;
  familyUnitLabel: string;
}

const relationshipOptions = [
  { value: 'spouse', label: 'Spouse/Partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'in_law', label: 'In-Law' },
  { value: 'other', label: 'Other Family Member' },
];

export const FamilyInvitationDialog: React.FC<FamilyInvitationDialogProps> = ({
  open,
  onOpenChange,
  familyUnitId,
  familyUnitLabel,
}) => {
  const [formData, setFormData] = useState<CreateInvitationData>({
    familyUnitId,
    inviteeEmail: '',
    inviteeName: '',
    relationshipRole: '',
    personalMessage: '',
  });
  const [sending, setSending] = useState(false);
  
  const { sendInvitation } = useFamilyInvitations(familyUnitId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.inviteeEmail || !formData.relationshipRole) return;

    setSending(true);
    const success = await sendInvitation({
      ...formData,
      familyUnitId,
    });

    if (success) {
      handleClose();
    }
    setSending(false);
  };

  const handleClose = () => {
    setFormData({
      familyUnitId,
      inviteeEmail: '',
      inviteeName: '',
      relationshipRole: '',
      personalMessage: '',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Invite Family Member
          </DialogTitle>
          <DialogDescription>
            Send an invitation to join the <strong>{familyUnitLabel}</strong> family unit
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="inviteeName">Name (Optional)</Label>
              <Input
                id="inviteeName"
                placeholder="Enter their name"
                value={formData.inviteeName}
                onChange={(e) => setFormData({ ...formData, inviteeName: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="inviteeEmail">Email Address *</Label>
              <Input
                id="inviteeEmail"
                type="email"
                placeholder="Enter their email address"
                value={formData.inviteeEmail}
                onChange={(e) => setFormData({ ...formData, inviteeEmail: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="relationshipRole">Relationship *</Label>
              <Select
                value={formData.relationshipRole}
                onValueChange={(value) => setFormData({ ...formData, relationshipRole: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {relationshipOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
              <Textarea
                id="personalMessage"
                placeholder="Add a personal message to your invitation..."
                value={formData.personalMessage}
                onChange={(e) => setFormData({ ...formData, personalMessage: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending || !formData.inviteeEmail || !formData.relationshipRole}
            >
              <Send className="h-4 w-4 mr-2" />
              {sending ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};