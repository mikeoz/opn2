import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserPlus, Users, Search, Send, X, AlertTriangle, CheckCircle } from 'lucide-react';
import { useFamilyInvitations, CreateInvitationData } from '@/hooks/useFamilyInvitations';
import { useFamilyConnections } from '@/hooks/useFamilyConnections';

interface UnifiedFamilyAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  familyUnitId: string;
  familyUnitLabel: string;
}

const relationshipOptions = [
  { value: 'spouse', label: 'Spouse/Partner', description: 'Married or life partner' },
  { value: 'child', label: 'Child', description: 'Son or daughter' },
  { value: 'parent', label: 'Parent', description: 'Mother or father' },
  { value: 'sibling', label: 'Sibling', description: 'Brother or sister' },
  { value: 'grandparent', label: 'Grandparent', description: 'Grandmother or grandfather' },
  { value: 'grandchild', label: 'Grandchild', description: 'Grandson or granddaughter' },
  { value: 'in_law', label: 'In-Law', description: 'Related by marriage' },
  { value: 'other', label: 'Other Family Member', description: 'Extended family' },
];

export const UnifiedFamilyAddDialog: React.FC<UnifiedFamilyAddDialogProps> = ({
  open,
  onOpenChange,
  familyUnitId,
  familyUnitLabel,
}) => {
  const [activeTab, setActiveTab] = useState('individual');
  
  // Individual invitation state
  const [invitationData, setInvitationData] = useState<CreateInvitationData>({
    familyUnitId,
    inviteeEmail: '',
    inviteeName: '',
    relationshipRole: '',
    personalMessage: '',
  });
  const [checkingInvitation, setCheckingInvitation] = useState(false);
  const [existingInvitation, setExistingInvitation] = useState<any>(null);
  
  // Family connection state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [connectionMessage, setConnectionMessage] = useState('');
  const [searching, setSearching] = useState(false);
  
  const [sending, setSending] = useState(false);
  
  const { sendInvitation, checkExistingInvitation } = useFamilyInvitations(familyUnitId);
  const { sendConnection, searchFamilyUnits } = useFamilyConnections(familyUnitId);

  // Check for existing invitation when email changes
  const handleEmailChange = async (email: string) => {
    setInvitationData({ ...invitationData, inviteeEmail: email });
    setExistingInvitation(null);
    
    if (email && email.includes('@')) {
      setCheckingInvitation(true);
      const existing = await checkExistingInvitation(email, familyUnitId);
      setExistingInvitation(existing);
      setCheckingInvitation(false);
    }
  };

  // Handle family search
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setSearching(true);
    try {
      const results = await searchFamilyUnits(searchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  // Handle individual invitation submission
  const handleInvitationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitationData.inviteeEmail || !invitationData.relationshipRole) return;
    if (existingInvitation) return;

    setSending(true);
    const success = await sendInvitation(invitationData);
    if (success) {
      handleClose();
    }
    setSending(false);
  };

  // Handle family connection submission
  const handleConnectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamily) return;

    setSending(true);
    const success = await sendConnection({
      targetFamilyUnitId: selectedFamily.id,
      connectionDirection: 'invitation',
      personalMessage: connectionMessage || undefined,
    });
    if (success) {
      handleClose();
    }
    setSending(false);
  };

  const handleClose = () => {
    setInvitationData({
      familyUnitId,
      inviteeEmail: '',
      inviteeName: '',
      relationshipRole: '',
      personalMessage: '',
    });
    setSearchTerm('');
    setSelectedFamily(null);
    setSearchResults([]);
    setConnectionMessage('');
    setExistingInvitation(null);
    setActiveTab('individual');
    onOpenChange(false);
  };

  const getRelationshipInfo = (value: string) => {
    return relationshipOptions.find(opt => opt.value === value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add to {familyUnitLabel}
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to grow your family unit
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Individual
            </TabsTrigger>
            <TabsTrigger value="family" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Connect Family
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="space-y-4 mt-6">
            <div className="text-sm text-muted-foreground mb-4">
              Invite someone to join <strong>{familyUnitLabel}</strong> as an individual member
            </div>
            
            <form onSubmit={handleInvitationSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="inviteeName">Name (Optional)</Label>
                  <Input
                    id="inviteeName"
                    placeholder="Enter their name"
                    value={invitationData.inviteeName}
                    onChange={(e) => setInvitationData({ ...invitationData, inviteeName: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="inviteeEmail">Email Address *</Label>
                  <Input
                    id="inviteeEmail"
                    type="email"
                    placeholder="Enter their email address"
                    value={invitationData.inviteeEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    required
                  />
                  {checkingInvitation && (
                    <div className="text-sm text-muted-foreground mt-1">
                      Checking for existing invitations...
                    </div>
                  )}
                  {existingInvitation && (
                    <Alert className="mt-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        An invitation is already pending for this email address. 
                        Please wait for them to respond or cancel the existing invitation.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div>
                  <Label htmlFor="relationshipRole">Relationship *</Label>
                  <Select
                    value={invitationData.relationshipRole}
                    onValueChange={(value) => setInvitationData({ ...invitationData, relationshipRole: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="How are they related to your family?" />
                    </SelectTrigger>
                    <SelectContent>
                      {relationshipOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex flex-col">
                            <span>{option.label}</span>
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {invitationData.relationshipRole && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {getRelationshipInfo(invitationData.relationshipRole)?.description}
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                  <Textarea
                    id="personalMessage"
                    placeholder="Add a personal message to your invitation..."
                    value={invitationData.personalMessage}
                    onChange={(e) => setInvitationData({ ...invitationData, personalMessage: e.target.value })}
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
                  disabled={sending || !invitationData.inviteeEmail || !invitationData.relationshipRole || !!existingInvitation}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="family" className="space-y-4 mt-6">
            <div className="text-sm text-muted-foreground mb-4">
              Connect with another family unit to expand your family tree
            </div>
            
            <form onSubmit={handleConnectionSubmit} className="space-y-4">
              {/* Family Search */}
              <div>
                <Label htmlFor="familySearch">Search for Family Unit</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="familySearch"
                    placeholder="Enter family name to search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                  />
                  <Button
                    type="button"
                    onClick={handleSearch}
                    disabled={searching || !searchTerm.trim()}
                    variant="outline"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div>
                  <Label>Available Family Units</Label>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {searchResults.map((family) => (
                      <div
                        key={family.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedFamily?.id === family.id ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                        onClick={() => setSelectedFamily(family)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{family.family_label}</h4>
                            <p className="text-sm text-muted-foreground">
                              Led by {family.profiles?.first_name} {family.profiles?.last_name}
                            </p>
                          </div>
                          {selectedFamily?.id === family.id && (
                            <Badge variant="default">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Selected Family Info */}
              {selectedFamily && (
                <Alert>
                  <Users className="h-4 w-4" />
                  <AlertDescription>
                    You're inviting <strong>{selectedFamily.family_label}</strong> to connect as a child family under <strong>{familyUnitLabel}</strong>.
                    They will receive an invitation and can choose to accept or decline.
                  </AlertDescription>
                </Alert>
              )}

              {/* Personal Message */}
              <div>
                <Label htmlFor="connectionMessage">Personal Message (Optional)</Label>
                <Textarea
                  id="connectionMessage"
                  placeholder="Explain why you'd like to connect your families..."
                  value={connectionMessage}
                  onChange={(e) => setConnectionMessage(e.target.value)}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={sending || !selectedFamily}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sending...' : 'Send Connection Invitation'}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};