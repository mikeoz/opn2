import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, Building2, Image as ImageIcon } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

const OrganizationBrandingSettings = () => {
  const { profile, updateProfile, uploadLogo, loading } = useProfile();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    organization_name: profile?.organization_name || '',
  });
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await uploadLogo(file);
    } finally {
      setUploading(false);
      // Reset the input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await updateProfile(formData);
    if (success) {
      toast({
        title: "Success",
        description: "Organization branding updated successfully"
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">Loading branding settings...</div>
        </CardContent>
      </Card>
    );
  }

  // Don't show for individual accounts
  if (profile?.account_type === 'individual') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            Organization branding is only available for organization accounts.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Organization Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div className="space-y-4">
            <Label className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization Logo
            </Label>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage 
                    src={profile?.logo_url} 
                    alt="Organization Logo"
                    className="object-contain"
                  />
                  <AvatarFallback className="text-lg bg-primary/10">
                    <Building2 className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                {profile?.logo_url && (
                  <Badge 
                    variant="secondary" 
                    className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-xs"
                  >
                    Logo Set
                  </Badge>
                )}
              </div>
              <div className="space-y-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => logoInputRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  JPG, PNG, or SVG. Max 2MB. Recommended: 300x300px
                </p>
              </div>
            </div>
          </div>

          {/* Organization Details Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="organization_name">Organization Name</Label>
              <Input
                id="organization_name"
                value={formData.organization_name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  organization_name: e.target.value 
                }))}
                placeholder="Enter your organization name"
              />
            </div>

            <Button type="submit" className="w-full">
              Update Branding Settings
            </Button>
          </form>

          {/* Branding Preview */}
          <div className="border-t pt-6">
            <Label className="text-base font-semibold flex items-center gap-2 mb-4">
              <ImageIcon className="h-4 w-4" />
              Logo Preview
            </Label>
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={profile?.logo_url} 
                    alt="Logo Preview"
                    className="object-contain"
                  />
                  <AvatarFallback>
                    <Building2 className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-semibold">
                    {formData.organization_name || profile?.organization_name || 'Your Organization'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Preview of how your logo will appear on cards
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizationBrandingSettings;