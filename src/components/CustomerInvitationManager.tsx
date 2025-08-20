import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Users, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';

interface CustomerInvitation {
  id: string;
  recipient_email: string;
  recipient_name?: string;
  status: 'pending' | 'sent' | 'accepted' | 'expired';
  invitation_data: any;
  sent_at?: string;
  accepted_at?: string;
  expires_at?: string;
  created_at: string;
}

export default function CustomerInvitationManager() {
  const [invitations, setInvitations] = useState<CustomerInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingInvitation, setSendingInvitation] = useState(false);
  const { merchantProfile } = useMerchantProfile();

  const [invitationForm, setInvitationForm] = useState({
    recipientEmail: '',
    recipientName: '',
    invitationType: 'customer_onboarding' as 'customer_onboarding' | 'card_share' | 'loyalty_program',
    customMessage: ''
  });

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('card_invitations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvitations((data || []).map(item => ({
        ...item,
        status: item.status as 'pending' | 'sent' | 'accepted' | 'expired'
      })));
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast.error('Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async () => {
    if (!invitationForm.recipientEmail || !invitationForm.invitationType) {
      toast.error('Please fill in required fields');
      return;
    }

    setSendingInvitation(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-customer-invitation', {
        body: {
          recipientEmail: invitationForm.recipientEmail,
          recipientName: invitationForm.recipientName,
          merchantName: merchantProfile?.user_profile?.organization_name || merchantProfile?.name || 'Your Business',
          customMessage: invitationForm.customMessage,
          invitationType: invitationForm.invitationType,
          invitationData: {
            merchantId: merchantProfile?.id
          }
        }
      });

      if (error) throw error;

      toast.success('Invitation sent successfully!');
      setInvitationForm({
        recipientEmail: '',
        recipientName: '',
        invitationType: 'customer_onboarding',
        customMessage: ''
      });
      await fetchInvitations();
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation: ' + error.message);
    } finally {
      setSendingInvitation(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'expired':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'accepted':
        return 'default';
      case 'expired':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getInvitationTypeDisplay = (type: string) => {
    switch (type) {
      case 'customer_onboarding':
        return 'Customer Onboarding';
      case 'card_share':
        return 'Business Card Share';
      case 'loyalty_program':
        return 'Loyalty Program';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-6 w-6" />
        <h2 className="text-2xl font-bold">Customer Invitations</h2>
      </div>

      <Tabs defaultValue="send" className="space-y-4">
        <TabsList>
          <TabsTrigger value="send">Send Invitation</TabsTrigger>
          <TabsTrigger value="manage">Manage Invitations</TabsTrigger>
        </TabsList>

        <TabsContent value="send">
          <Card>
            <CardHeader>
              <CardTitle>Send Customer Invitation</CardTitle>
              <CardDescription>
                Invite customers to join your community and access your services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="recipientEmail">Email Address *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    placeholder="customer@example.com"
                    value={invitationForm.recipientEmail}
                    onChange={(e) => setInvitationForm({
                      ...invitationForm,
                      recipientEmail: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recipientName">Name (Optional)</Label>
                  <Input
                    id="recipientName"
                    placeholder="Customer Name"
                    value={invitationForm.recipientName}
                    onChange={(e) => setInvitationForm({
                      ...invitationForm,
                      recipientName: e.target.value
                    })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invitationType">Invitation Type *</Label>
                <Select
                  value={invitationForm.invitationType}
                  onValueChange={(value: any) => setInvitationForm({
                    ...invitationForm,
                    invitationType: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer_onboarding">Customer Onboarding</SelectItem>
                    <SelectItem value="card_share">Business Card Share</SelectItem>
                    <SelectItem value="loyalty_program">Loyalty Program</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customMessage">Custom Message (Optional)</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Add a personal message to your invitation..."
                  value={invitationForm.customMessage}
                  onChange={(e) => setInvitationForm({
                    ...invitationForm,
                    customMessage: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <Button 
                onClick={sendInvitation} 
                disabled={sendingInvitation || !invitationForm.recipientEmail}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingInvitation ? 'Sending...' : 'Send Invitation'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Invitation History</CardTitle>
              <CardDescription>
                Track and manage your sent invitations
              </CardDescription>
              <Button onClick={fetchInvitations} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No invitations sent yet</p>
                  <p className="text-sm">Send your first customer invitation to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(invitation.status)}
                        <div>
                          <div className="font-medium">
                            {invitation.recipient_name || invitation.recipient_email}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invitation.recipient_email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <div>
                          <Badge variant={getStatusColor(invitation.status) as any}>
                            {invitation.status}
                          </Badge>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getInvitationTypeDisplay(invitation.invitation_data?.type || 'unknown')}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invitation.sent_at
                            ? new Date(invitation.sent_at).toLocaleDateString()
                            : new Date(invitation.created_at).toLocaleDateString()
                          }
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}