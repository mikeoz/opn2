import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Mail, MessageSquare, Users, Send, Upload, Download, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface EnhancedInvitationSystemProps {
  familyUnitId: string;
  familyUnitLabel: string;
  isOwner: boolean;
}

interface BulkInvitation {
  name: string;
  email: string;
  phone?: string;
  relationship: string;
  personalMessage?: string;
  preferredMethod: 'email' | 'sms' | 'both';
}

const INVITATION_TEMPLATES = [
  {
    id: 'formal',
    name: 'Formal',
    subject: 'Invitation to join {familyName}',
    message: 'You are cordially invited to join our family unit on Opn.li. This will allow us to share important family information and stay connected.'
  },
  {
    id: 'casual',
    name: 'Casual',
    subject: 'Join our family on Opn.li!',
    message: 'Hey! We\'d love for you to join our family group on Opn.li. It\'s a great way for us to stay connected and share updates.'
  },
  {
    id: 'emergency',
    name: 'Emergency Contacts',
    subject: 'Important: Family Emergency Contact Setup',
    message: 'We\'re setting up our family emergency contact system. Please join our family unit so we can ensure everyone has the most up-to-date contact information.'
  }
];

export const EnhancedInvitationSystem: React.FC<EnhancedInvitationSystemProps> = ({
  familyUnitId,
  familyUnitLabel,
  isOwner,
}) => {
  const [activeTab, setActiveTab] = useState('single');
  const [bulkInvitations, setBulkInvitations] = useState<BulkInvitation[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('casual');
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [invitationSettings, setInvitationSettings] = useState({
    enableSMS: true,
    enableReminders: true,
    reminderDays: [3, 7],
    expirationDays: 14,
    requireApproval: false
  });

  const handleAddBulkInvitation = () => {
    setBulkInvitations([...bulkInvitations, {
      name: '',
      email: '',
      phone: '',
      relationship: '',
      personalMessage: '',
      preferredMethod: 'email'
    }]);
  };

  const handleRemoveBulkInvitation = (index: number) => {
    setBulkInvitations(bulkInvitations.filter((_, i) => i !== index));
  };

  const handleBulkInvitationChange = (index: number, field: keyof BulkInvitation, value: string) => {
    const updated = [...bulkInvitations];
    updated[index] = { ...updated[index], [field]: value };
    setBulkInvitations(updated);
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const imported = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const invitation: BulkInvitation = {
            name: '',
            email: '',
            relationship: '',
            preferredMethod: 'email'
          };
          
          headers.forEach((header, index) => {
            if (header === 'name' && values[index]) invitation.name = values[index];
            if (header === 'email' && values[index]) invitation.email = values[index];
            if (header === 'phone' && values[index]) invitation.phone = values[index];
            if (header === 'relationship' && values[index]) invitation.relationship = values[index];
          });
          
          return invitation;
        }).filter(inv => inv.name && inv.email);
        
        setBulkInvitations([...bulkInvitations, ...imported]);
      };
      reader.readAsText(file);
    }
  };

  const generateInvitationPreview = () => {
    const template = INVITATION_TEMPLATES.find(t => t.id === selectedTemplate);
    const subject = customSubject || template?.subject.replace('{familyName}', familyUnitLabel) || '';
    const message = customMessage || template?.message || '';
    
    return { subject, message };
  };

  const handleSendBulkInvitations = async () => {
    // Implementation would go here
    console.log('Sending bulk invitations:', bulkInvitations);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Enhanced Invitation System</h3>
          <p className="text-sm text-muted-foreground">
            Send email and SMS invitations with advanced tracking and templates
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Enhanced Features
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="single">Single Invite</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Invites</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Send Individual Invitation</CardTitle>
              <CardDescription>
                Invite a single person to join {familyUnitLabel}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="singleName">Full Name</Label>
                  <Input id="singleName" placeholder="Enter their full name" />
                </div>
                <div>
                  <Label htmlFor="singleEmail">Email Address</Label>
                  <Input id="singleEmail" type="email" placeholder="their.email@example.com" />
                </div>
                <div>
                  <Label htmlFor="singlePhone">Phone Number (Optional)</Label>
                  <Input id="singlePhone" type="tel" placeholder="+1 (555) 123-4567" />
                </div>
                <div>
                  <Label htmlFor="singleRelationship">Relationship</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spouse">Spouse/Partner</SelectItem>
                      <SelectItem value="child">Child</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="grandchild">Grandchild</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Invitation Method</Label>
                <div className="flex gap-2 mt-2">
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Email Only
                  </Button>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    SMS Only
                  </Button>
                  <Button variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-2" />
                    Both
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="singleMessage">Personal Message (Optional)</Label>
                <Textarea
                  id="singleMessage"
                  placeholder="Add a personal message to your invitation..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end">
                <Button>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Bulk Invitation Management
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleAddBulkInvitation}>
                    Add Person
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <label htmlFor="csv-import" className="cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </label>
                  </Button>
                  <input
                    id="csv-import"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleImportCSV}
                  />
                </div>
              </CardTitle>
              <CardDescription>
                Invite multiple people at once with personalized messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bulkInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bulk invitations added yet</p>
                  <p className="text-sm">Add people individually or import from CSV</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bulkInvitations.map((invitation, index) => (
                    <Card key={index} className="relative">
                      <CardContent className="pt-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleRemoveBulkInvitation(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Name</Label>
                            <Input
                              value={invitation.name}
                              onChange={(e) => handleBulkInvitationChange(index, 'name', e.target.value)}
                              placeholder="Full name"
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input
                              type="email"
                              value={invitation.email}
                              onChange={(e) => handleBulkInvitationChange(index, 'email', e.target.value)}
                              placeholder="email@example.com"
                            />
                          </div>
                          <div>
                            <Label>Phone (Optional)</Label>
                            <Input
                              type="tel"
                              value={invitation.phone || ''}
                              onChange={(e) => handleBulkInvitationChange(index, 'phone', e.target.value)}
                              placeholder="+1 (555) 123-4567"
                            />
                          </div>
                          <div>
                            <Label>Relationship</Label>
                            <Select
                              value={invitation.relationship}
                              onValueChange={(value) => handleBulkInvitationChange(index, 'relationship', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select relationship" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="spouse">Spouse/Partner</SelectItem>
                                <SelectItem value="child">Child</SelectItem>
                                <SelectItem value="parent">Parent</SelectItem>
                                <SelectItem value="sibling">Sibling</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Method</Label>
                            <Select
                              value={invitation.preferredMethod}
                              onValueChange={(value) => handleBulkInvitationChange(index, 'preferredMethod', value as 'email' | 'sms' | 'both')}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="email">Email</SelectItem>
                                <SelectItem value="sms">SMS</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Personal Message</Label>
                            <Input
                              value={invitation.personalMessage || ''}
                              onChange={(e) => handleBulkInvitationChange(index, 'personalMessage', e.target.value)}
                              placeholder="Optional personal message"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  <div className="flex justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {bulkInvitations.length} invitation(s) ready
                    </div>
                    <Button onClick={handleSendBulkInvitations}>
                      <Send className="h-4 w-4 mr-2" />
                      Send All Invitations
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invitation Templates</CardTitle>
              <CardDescription>
                Choose or customize invitation message templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Select Template</Label>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVITATION_TEMPLATES.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div>
                <Label htmlFor="customSubject">Custom Subject Line</Label>
                <Input
                  id="customSubject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder={INVITATION_TEMPLATES.find(t => t.id === selectedTemplate)?.subject}
                />
              </div>

              <div>
                <Label htmlFor="customMessage">Custom Message</Label>
                <Textarea
                  id="customMessage"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder={INVITATION_TEMPLATES.find(t => t.id === selectedTemplate)?.message}
                  rows={4}
                />
              </div>

              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  <strong>Preview:</strong>
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="font-medium">{generateInvitationPreview().subject}</p>
                    <p className="text-sm mt-1">{generateInvitationPreview().message}</p>
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invitation Settings</CardTitle>
              <CardDescription>
                Configure invitation behavior and tracking
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable SMS Invitations</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow sending invitations via SMS
                    </p>
                  </div>
                  <Button
                    variant={invitationSettings.enableSMS ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInvitationSettings({
                      ...invitationSettings,
                      enableSMS: !invitationSettings.enableSMS
                    })}
                  >
                    {invitationSettings.enableSMS ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Reminders</Label>
                    <p className="text-xs text-muted-foreground">
                      Send reminder emails for pending invitations
                    </p>
                  </div>
                  <Button
                    variant={invitationSettings.enableReminders ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInvitationSettings({
                      ...invitationSettings,
                      enableReminders: !invitationSettings.enableReminders
                    })}
                  >
                    {invitationSettings.enableReminders ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div>
                  <Label>Invitation Expiration</Label>
                  <Select
                    value={invitationSettings.expirationDays.toString()}
                    onValueChange={(value) => setInvitationSettings({
                      ...invitationSettings,
                      expirationDays: parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="14">14 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="0">Never expire</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Approval</Label>
                    <p className="text-xs text-muted-foreground">
                      Family members need approval before joining
                    </p>
                  </div>
                  <Button
                    variant={invitationSettings.requireApproval ? "default" : "outline"}
                    size="sm"
                    onClick={() => setInvitationSettings({
                      ...invitationSettings,
                      requireApproval: !invitationSettings.requireApproval
                    })}
                  >
                    {invitationSettings.requireApproval ? "Required" : "Optional"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};