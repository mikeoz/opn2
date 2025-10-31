import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePendingFamilyProfiles } from '@/hooks/usePendingFamilyProfiles';
import { useFamilyInvitations } from '@/hooks/useFamilyInvitations';
import { UserPlus, Baby, Users } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';

interface SeedProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUnitId: string;
  familyUnitLabel: string;
  generationLevel: number;
}

const emailSchema = z.string().trim().email('Invalid email address').max(255);
const nameSchema = z.string().trim().min(1, 'Name is required').max(100);
const phoneSchema = z.string().trim().max(20).optional();

const relationshipOptions = [
  'Parent', 'Child', 'Spouse', 'Sibling', 'Grandparent', 
  'Grandchild', 'Aunt/Uncle', 'Cousin', 'Other'
];

export const SeedProfileDialog: React.FC<SeedProfileDialogProps> = ({
  open,
  onOpenChange,
  familyUnitId,
  familyUnitLabel,
  generationLevel
}) => {
  const [activeTab, setActiveTab] = useState('existing');
  const [loading, setLoading] = useState(false);
  
  // Existing member invitation
  const [existingEmail, setExistingEmail] = useState('');
  const [existingRelationship, setExistingRelationship] = useState('');
  const [existingMessage, setExistingMessage] = useState('');
  
  // Adult seed profile
  const [adultFirstName, setAdultFirstName] = useState('');
  const [adultLastName, setAdultLastName] = useState('');
  const [adultEmail, setAdultEmail] = useState('');
  const [adultPhone, setAdultPhone] = useState('');
  const [adultRelationship, setAdultRelationship] = useState('');
  
  // Minor seed profile
  const [minorFirstName, setMinorFirstName] = useState('');
  const [minorLastName, setMinorLastName] = useState('');
  const [minorEmail, setMinorEmail] = useState('');
  const [minorPhone, setMinorPhone] = useState('');
  const [minorRelationship, setMinorRelationship] = useState('');

  const { sendInvitation } = useFamilyInvitations(familyUnitId);
  const { createSeedProfile, sendInvitation: sendClaimInvitation } = usePendingFamilyProfiles(familyUnitId);

  const resetForms = () => {
    setExistingEmail('');
    setExistingRelationship('');
    setExistingMessage('');
    setAdultFirstName('');
    setAdultLastName('');
    setAdultEmail('');
    setAdultPhone('');
    setAdultRelationship('');
    setMinorFirstName('');
    setMinorLastName('');
    setMinorEmail('');
    setMinorPhone('');
    setMinorRelationship('');
  };

  const handleInviteExisting = async () => {
    try {
      emailSchema.parse(existingEmail);
      if (!existingRelationship) {
        toast.error('Please select a relationship');
        return;
      }

      setLoading(true);
      const success = await sendInvitation({
        familyUnitId,
        inviteeEmail: existingEmail,
        inviteeName: existingEmail,
        relationshipRole: existingRelationship,
        personalMessage: existingMessage
      });

      if (success) {
        resetForms();
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

  const handleCreateAdult = async () => {
    try {
      nameSchema.parse(adultFirstName);
      emailSchema.parse(adultEmail);
      if (adultPhone) phoneSchema.parse(adultPhone);
      if (!adultRelationship) {
        toast.error('Please select a relationship');
        return;
      }

      setLoading(true);
      const profileId = await createSeedProfile({
        familyUnitId,
        firstName: adultFirstName,
        lastName: adultLastName,
        email: adultEmail,
        phone: adultPhone,
        relationshipLabel: adultRelationship,
        generationLevel,
        memberType: 'adult'
      });

      if (profileId) {
        // Automatically send invitation to the adult's email
        await sendClaimInvitation(profileId);
        resetForms();
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

  const handleCreateMinor = async () => {
    try {
      nameSchema.parse(minorFirstName);
      if (minorEmail) emailSchema.parse(minorEmail);
      if (minorPhone) phoneSchema.parse(minorPhone);
      if (!minorRelationship) {
        toast.error('Please select a relationship');
        return;
      }

      setLoading(true);
      const success = await createSeedProfile({
        familyUnitId,
        firstName: minorFirstName,
        lastName: minorLastName,
        email: minorEmail || `minor_${Date.now()}@pending.opn2.com`,
        phone: minorPhone,
        relationshipLabel: minorRelationship,
        generationLevel,
        memberType: 'minor'
      });

      if (success) {
        resetForms();
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Family Member to {familyUnitLabel}</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="existing" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Existing Member</span>
            </TabsTrigger>
            <TabsTrigger value="adult" className="gap-2">
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Adult Profile</span>
            </TabsTrigger>
            <TabsTrigger value="minor" className="gap-2">
              <Baby className="h-4 w-4" />
              <span className="hidden sm:inline">Minor Child</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Invite an existing Opn2 member to join this family unit.
            </p>
            <div className="space-y-3">
              <div>
                <Label htmlFor="existing-email">Email Address *</Label>
                <Input
                  id="existing-email"
                  type="email"
                  value={existingEmail}
                  onChange={(e) => setExistingEmail(e.target.value)}
                  placeholder="member@example.com"
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="existing-relationship">Relationship *</Label>
                <Select value={existingRelationship} onValueChange={setExistingRelationship}>
                  <SelectTrigger id="existing-relationship">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map(rel => (
                      <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="existing-message">Personal Message (Optional)</Label>
                <Textarea
                  id="existing-message"
                  value={existingMessage}
                  onChange={(e) => setExistingMessage(e.target.value)}
                  placeholder="Add a personal message..."
                  rows={3}
                  maxLength={500}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleInviteExisting} disabled={loading}>
                Send Invitation
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="adult" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a profile for an adult child. An invitation email will be sent to them to claim their profile.
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="adult-first-name">First Name *</Label>
                  <Input
                    id="adult-first-name"
                    value={adultFirstName}
                    onChange={(e) => setAdultFirstName(e.target.value)}
                    placeholder="First name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="adult-last-name">Last Name</Label>
                  <Input
                    id="adult-last-name"
                    value={adultLastName}
                    onChange={(e) => setAdultLastName(e.target.value)}
                    placeholder="Last name"
                    maxLength={100}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="adult-email">Email Address *</Label>
                <Input
                  id="adult-email"
                  type="email"
                  value={adultEmail}
                  onChange={(e) => setAdultEmail(e.target.value)}
                  placeholder="email@example.com"
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="adult-phone">Phone Number</Label>
                <Input
                  id="adult-phone"
                  type="tel"
                  value={adultPhone}
                  onChange={(e) => setAdultPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="adult-relationship">Relationship *</Label>
                <Select value={adultRelationship} onValueChange={setAdultRelationship}>
                  <SelectTrigger id="adult-relationship">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map(rel => (
                      <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleCreateAdult} disabled={loading}>
                Create & Send Invitation
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="minor" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Create a profile for a minor child. Email is optional. You will retain control until you transfer ownership to them.
            </p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="minor-first-name">First Name *</Label>
                  <Input
                    id="minor-first-name"
                    value={minorFirstName}
                    onChange={(e) => setMinorFirstName(e.target.value)}
                    placeholder="First name"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="minor-last-name">Last Name</Label>
                  <Input
                    id="minor-last-name"
                    value={minorLastName}
                    onChange={(e) => setMinorLastName(e.target.value)}
                    placeholder="Last name"
                    maxLength={100}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="minor-email">Email Address (Optional)</Label>
                <Input
                  id="minor-email"
                  type="email"
                  value={minorEmail}
                  onChange={(e) => setMinorEmail(e.target.value)}
                  placeholder="email@example.com"
                  maxLength={255}
                />
              </div>
              <div>
                <Label htmlFor="minor-phone">Phone Number (Optional)</Label>
                <Input
                  id="minor-phone"
                  type="tel"
                  value={minorPhone}
                  onChange={(e) => setMinorPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  maxLength={20}
                />
              </div>
              <div>
                <Label htmlFor="minor-relationship">Relationship *</Label>
                <Select value={minorRelationship} onValueChange={setMinorRelationship}>
                  <SelectTrigger id="minor-relationship">
                    <SelectValue placeholder="Select relationship" />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipOptions.map(rel => (
                      <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleCreateMinor} disabled={loading}>
                Create Minor Profile
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
