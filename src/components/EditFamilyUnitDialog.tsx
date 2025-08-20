import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { FamilyUnit } from '@/hooks/useFamilyUnits';

interface EditFamilyUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUnit: FamilyUnit | null;
  onUpdate: (unitId: string, updates: { family_label: string; family_metadata: any }) => Promise<boolean>;
}

export const EditFamilyUnitDialog = ({ 
  open, 
  onOpenChange, 
  familyUnit,
  onUpdate
}: EditFamilyUnitDialogProps) => {
  const [familyLabel, setFamilyLabel] = useState('');
  const [description, setDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  React.useEffect(() => {
    if (familyUnit) {
      setFamilyLabel(familyUnit.family_label);
      setDescription(familyUnit.family_metadata?.description || '');
    }
  }, [familyUnit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyUnit) return;

    setUpdating(true);
    const success = await onUpdate(familyUnit.id, {
      family_label: familyLabel,
      family_metadata: {
        ...familyUnit.family_metadata,
        description,
        updated_via: 'edit_dialog'
      }
    });

    if (success) {
      handleClose();
    }
    setUpdating(false);
  };

  const handleClose = () => {
    setFamilyLabel('');
    setDescription('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Family Unit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="family-label">Family Label</Label>
            <Input
              id="family-label"
              value={familyLabel}
              onChange={(e) => setFamilyLabel(e.target.value)}
              placeholder="Enter family label"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={updating}>
              {updating ? 'Updating...' : 'Update Family Unit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};