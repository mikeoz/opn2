import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, Plus, Eye, Download, Calendar, Zap, Store, Gift } from 'lucide-react';
import { toast } from 'sonner';
import { useMerchantProfile } from '@/hooks/useMerchantProfile';
import { useMerchantQRCodes } from '@/hooks/useMerchantQRCodes';
import { supabase } from '@/integrations/supabase/client';

interface QRCodeForm {
  display_name: string;
  description: string;
  qr_type: 'store_entry' | 'loyalty_program' | 'special_offer' | 'event_checkin';
  expires_at: string;
  metadata: {
    loyalty_points?: number;
    discount_percentage?: number;
    offer_details?: string;
  };
}

const QRTypeConfig = {
  store_entry: {
    icon: Store,
    label: 'Store Entry',
    description: 'Customers scan when visiting your store',
    color: 'bg-blue-500',
  },
  loyalty_program: {
    icon: Zap,
    label: 'Loyalty Program',
    description: 'Join loyalty program and earn points',
    color: 'bg-purple-500',
  },
  special_offer: {
    icon: Gift,
    label: 'Special Offer',
    description: 'Exclusive discount or promotion',
    color: 'bg-green-500',
  },
  event_checkin: {
    icon: Calendar,
    label: 'Event Check-in',
    description: 'Event attendance tracking',
    color: 'bg-orange-500',
  },
};

export default function MerchantQRManager() {
  const { merchantProfile } = useMerchantProfile();
  const { qrCodes, loading, refetch } = useMerchantQRCodes();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<QRCodeForm>({
    display_name: '',
    description: '',
    qr_type: 'store_entry',
    expires_at: '',
    metadata: {}
  });

  const handleCreateQR = async () => {
    if (!formData.display_name || !merchantProfile?.id) {
      toast.error('Please fill in required fields');
      return;
    }

    setCreating(true);
    try {
      const { error } = await supabase
        .from('merchant_qr_codes')
        .insert({
          merchant_id: merchantProfile.id,
          display_name: formData.display_name,
          description: formData.description,
          qr_type: formData.qr_type,
          expires_at: formData.expires_at || null,
          metadata: formData.metadata,
          qr_code_data: `demo-qr-${Date.now()}`, // Demo QR data
          is_active: true
        });

      if (error) throw error;

      toast.success('QR Code created successfully!');
      setShowCreateDialog(false);
      setFormData({
        display_name: '',
        description: '',
        qr_type: 'store_entry',
        expires_at: '',
        metadata: {}
      });
      refetch();
    } catch (error: any) {
      console.error('Error creating QR code:', error);
      toast.error('Failed to create QR code');
    } finally {
      setCreating(false);
    }
  };

  const toggleQRStatus = async (qrId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('merchant_qr_codes')
        .update({ is_active: !currentStatus })
        .eq('id', qrId);

      if (error) throw error;

      toast.success(`QR Code ${!currentStatus ? 'activated' : 'deactivated'}`);
      refetch();
    } catch (error) {
      toast.error('Failed to update QR code status');
    }
  };

  const generateQRPreview = (qrData: string) => {
    // Demo Mode: Generate a preview URL
    const demoUrl = `https://demo.opn2.com/scan/${qrData}`;
    return demoUrl;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode className="h-6 w-6" />
          <h2 className="text-2xl font-bold">QR Code Manager</h2>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_name">Display Name *</Label>
                <Input
                  id="display_name"
                  placeholder="Main Entrance QR"
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="qr_type">QR Type *</Label>
                <Select value={formData.qr_type} onValueChange={(value: any) => setFormData({ ...formData, qr_type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(QRTypeConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Scan when entering the store for loyalty points"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At (Optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                />
              </div>

              {formData.qr_type === 'loyalty_program' && (
                <div className="space-y-2">
                  <Label htmlFor="loyalty_points">Points Reward</Label>
                  <Input
                    id="loyalty_points"
                    type="number"
                    placeholder="10"
                    value={formData.metadata.loyalty_points || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, loyalty_points: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              )}

              {formData.qr_type === 'special_offer' && (
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Discount %</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    placeholder="15"
                    value={formData.metadata.discount_percentage || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      metadata: { ...formData.metadata, discount_percentage: parseInt(e.target.value) || 0 }
                    })}
                  />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateQR} disabled={creating}>
                  {creating ? 'Creating...' : 'Create QR Code'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Demo Mode Info */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-4">
          <p className="text-sm text-yellow-800">
            <strong>Demo Mode:</strong> QR codes generate demo URLs for testing. In Alpha Testing, these will be real QR codes that redirect to your customer onboarding flow.
          </p>
        </CardContent>
      </Card>

      {/* QR Codes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Loading QR codes...</p>
            </CardContent>
          </Card>
        ) : qrCodes.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <QrCode className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No QR codes created yet</p>
              <p className="text-sm text-muted-foreground">Create your first QR code to get started</p>
            </CardContent>
          </Card>
        ) : (
          qrCodes.map((qr) => {
            const config = QRTypeConfig[qr.qr_type as keyof typeof QRTypeConfig];
            const IconComponent = config?.icon || QrCode;
            
            return (
              <Card key={qr.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className={`p-2 rounded-full ${config?.color || 'bg-gray-500'} text-white`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    {qr.display_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{qr.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <Badge variant={qr.is_active ? "default" : "secondary"}>
                      {qr.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-sm font-medium">{qr.scan_count} scans</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const demoUrl = generateQRPreview(qr.qr_code_data);
                        navigator.clipboard.writeText(demoUrl);
                        toast.success('Demo URL copied to clipboard');
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleQRStatus(qr.id, qr.is_active)}
                    >
                      {qr.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>

                  {qr.expires_at && (
                    <p className="text-xs text-muted-foreground">
                      Expires: {new Date(qr.expires_at).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}