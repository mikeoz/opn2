import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FamilyUnit, useFamilyUnits } from '@/hooks/useFamilyUnits';

interface CreateFamilyUnitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingFamilyUnits: FamilyUnit[];
}

export const CreateFamilyUnitDialog: React.FC<CreateFamilyUnitDialogProps> = ({
  open,
  onOpenChange,
  existingFamilyUnits
}) => {
  const [familyLabel, setFamilyLabel] = useState('');
  const [parentFamilyUnitId, setParentFamilyUnitId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  
  const { createFamilyUnit } = useFamilyUnits();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyLabel.trim()) return;

    setCreating(true);
    try {
      const metadata = {
        description: description.trim() || undefined,
        created_via: 'dialog'
      };

      const success = await createFamilyUnit(
        familyLabel.trim(),
        parentFamilyUnitId || undefined,
        metadata
      );

      if (success) {
        setFamilyLabel('');
        setParentFamilyUnitId('');
        setDescription('');
        onOpenChange(false);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    if (!creating) {
      setFamilyLabel('');
      setParentFamilyUnitId('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Family Unit</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="family-label">Family Label</Label>
            <Input
              id="family-label"
              placeholder="e.g., Gerald Rosenlund, Jeff Rosenlund"
              value={familyLabel}
              onChange={(e) => setFamilyLabel(e.target.value)}
              required
            />
            <p className="text-sm text-muted-foreground">
              This typically represents the primary family name or the main couple's name
            </p>
          </div>

          {existingFamilyUnits.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="parent-family">Parent Family Unit (Optional)</Label>
              <Select value={parentFamilyUnitId} onValueChange={setParentFamilyUnitId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent family unit" />
                </SelectTrigger>
                <SelectContent>
                  {existingFamilyUnits.map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.family_label} (Gen {unit.generation_level})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select if this family unit is a child generation of an existing family
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional notes about this family unit..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={creating}
              size="sm"
              className="sm:h-10 w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={creating || !familyLabel.trim()}
              size="sm"
              className="sm:h-10 w-full sm:w-auto"
            >
              {creating ? 'Creating...' : 'Create Family Unit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};