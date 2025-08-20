import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, Send, X, Users, ArrowDown, ArrowUp } from 'lucide-react';
import { useFamilyConnections, CreateConnectionData } from '@/hooks/useFamilyConnections';

interface FamilyConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFamilyUnitId: string;
  currentFamilyLabel: string;
}

export const FamilyConnectionDialog: React.FC<FamilyConnectionDialogProps> = ({
  open,
  onOpenChange,
  currentFamilyUnitId,
  currentFamilyLabel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<any>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [connectionDirection, setConnectionDirection] = useState<'invitation' | 'request'>('invitation');
  const [personalMessage, setPersonalMessage] = useState('');
  const [searching, setSearching] = useState(false);
  const [sending, setSending] = useState(false);
  
  const { sendConnection, searchFamilyUnits } = useFamilyConnections(currentFamilyUnitId);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFamily) return;

    setSending(true);
    const success = await sendConnection({
      targetFamilyUnitId: selectedFamily.id,
      connectionDirection,
      personalMessage: personalMessage || undefined,
    });

    if (success) {
      handleClose();
    }
    setSending(false);
  };

  const handleClose = () => {
    setSearchTerm('');
    setSelectedFamily(null);
    setSearchResults([]);
    setConnectionDirection('invitation');
    setPersonalMessage('');
    onOpenChange(false);
  };

  const getDirectionInfo = () => {
    if (connectionDirection === 'invitation') {
      return {
        title: 'Invite Family to Connect',
        description: `Invite another family to connect as a child family under ${currentFamilyLabel}`,
        icon: <ArrowDown className="h-4 w-4" />,
        action: 'Send Invitation',
        relationship: 'They will become a child family unit'
      };
    } else {
      return {
        title: 'Request to Join Family',
        description: `Request for ${currentFamilyLabel} to join another family as a child unit`,
        icon: <ArrowUp className="h-4 w-4" />,
        action: 'Send Request',
        relationship: 'You will become a child family unit'
      };
    }
  };

  const directionInfo = getDirectionInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Connect Family Units
          </DialogTitle>
          <DialogDescription>
            Create family tree connections with other family units
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Connection Direction Selection */}
          <div>
            <Label className="text-base font-medium">Connection Type</Label>
            <RadioGroup 
              value={connectionDirection} 
              onValueChange={(value: 'invitation' | 'request') => setConnectionDirection(value)}
              className="mt-2"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="invitation" id="invitation" />
                <div className="flex-1">
                  <Label htmlFor="invitation" className="flex items-center gap-2 cursor-pointer">
                    <ArrowDown className="h-4 w-4" />
                    Invite Another Family
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Invite them to connect as your child family unit
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-3 border rounded-lg">
                <RadioGroupItem value="request" id="request" />
                <div className="flex-1">
                  <Label htmlFor="request" className="flex items-center gap-2 cursor-pointer">
                    <ArrowUp className="h-4 w-4" />
                    Request to Join Family
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Request to join them as their child family unit
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

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
              <Label>Search Results</Label>
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
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Selected Family Info */}
          {selectedFamily && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Selected Connection</h4>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium">{currentFamilyLabel}</span>
                {directionInfo.icon}
                <span className="font-medium">{selectedFamily.family_label}</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {directionInfo.relationship}
              </p>
            </div>
          )}

          {/* Personal Message */}
          <div>
            <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
            <Textarea
              id="personalMessage"
              placeholder="Add a personal message to explain the connection..."
              value={personalMessage}
              onChange={(e) => setPersonalMessage(e.target.value)}
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
              {sending ? 'Sending...' : directionInfo.action}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};