import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRelationshipCards } from '@/hooks/useRelationshipCards';
import { toast } from 'sonner';

interface RelationshipInvitationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const relationshipLabels = [
  'Parent', 'Child', 'Spouse', 'Partner', 'Sibling',
  'Grandparent', 'Grandchild', 'Uncle', 'Aunt',
  'Nephew', 'Niece', 'Cousin', 'Step-Parent', 'Step-Child',
  'Step-Sibling', 'In-Law', 'Friend', 'Guardian', 'Ward'
];

export const RelationshipInvitationDialog: React.FC<RelationshipInvitationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { createInvitation } = useRelationshipCards();
  const [email, setEmail] = useState('');
  const [labelFrom, setLabelFrom] = useState('');
  const [labelTo, setLabelTo] = useState('');
  const [customLabelFrom, setCustomLabelFrom] = useState('');
  const [customLabelTo, setCustomLabelTo] = useState('');
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalLabelFrom = labelFrom === 'custom' ? customLabelFrom : labelFrom;
    const finalLabelTo = labelTo === 'custom' ? customLabelTo : labelTo;

    if (!email || !finalLabelFrom || !finalLabelTo) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    const success = await createInvitation({
      to_user_email: email,
      relationship_label_from: finalLabelFrom,
      relationship_label_to: finalLabelTo,
      metadata: {
        nickname,
        notes,
        invited_at: new Date().toISOString()
      }
    });

    setSubmitting(false);
    if (success) {
      setEmail('');
      setLabelFrom('');
      setLabelTo('');
      setCustomLabelFrom('');
      setCustomLabelTo('');
      setNickname('');
      setNotes('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to Relationship</DialogTitle>
          <DialogDescription>
            Create a bilateral relationship invitation. Both perspectives are captured.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="person@example.com"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labelFrom">I am their... *</Label>
              <Select value={labelFrom} onValueChange={setLabelFrom}>
                <SelectTrigger id="labelFrom">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {relationshipLabels.map(label => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {labelFrom === 'custom' && (
                <Input
                  value={customLabelFrom}
                  onChange={(e) => setCustomLabelFrom(e.target.value)}
                  placeholder="Enter custom label"
                  className="mt-2"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="labelTo">They are my... *</Label>
              <Select value={labelTo} onValueChange={setLabelTo}>
                <SelectTrigger id="labelTo">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {relationshipLabels.map(label => (
                    <SelectItem key={label} value={label}>{label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
              {labelTo === 'custom' && (
                <Input
                  value={customLabelTo}
                  onChange={(e) => setCustomLabelTo(e.target.value)}
                  placeholder="Enter custom label"
                  className="mt-2"
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Nickname (Optional)</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Mom, Dad, Sis..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Personal Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional context about this relationship..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
