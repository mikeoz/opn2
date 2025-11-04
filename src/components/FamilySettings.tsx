import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Settings, Users, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFamilyUnits, FamilyUnit } from '@/hooks/useFamilyUnits';

interface FamilySettingsProps {
  familyUnit: FamilyUnit;
  isOwner?: boolean;
}

interface FamilySettingsFormData {
  family_label: string;
  description: string;
  privacy_settings: {
    public_visibility: boolean;
    allow_search: boolean;
    show_member_count: boolean;
    show_generation_info: boolean;
  };
  member_permissions: {
    can_invite_members: boolean;
    can_share_family_cards: boolean;
    can_view_all_members: boolean;
    require_approval_for_sharing: boolean;
  };
  notification_settings: {
    notify_new_members: boolean;
    notify_card_sharing: boolean;
    notify_family_updates: boolean;
  };
}

const FamilySettings: React.FC<FamilySettingsProps> = ({
  familyUnit,
  isOwner = false
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { updateFamilyUnit, deactivateFamilyUnit } = useFamilyUnits();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDangerZone, setShowDangerZone] = useState(false);

  const form = useForm<FamilySettingsFormData>({
    defaultValues: {
      family_label: familyUnit.family_label,
      description: (familyUnit.family_metadata as any)?.description || '',
      privacy_settings: {
        public_visibility: (familyUnit.family_metadata as any)?.privacy_settings?.public_visibility ?? true,
        allow_search: (familyUnit.family_metadata as any)?.privacy_settings?.allow_search ?? true,
        show_member_count: (familyUnit.family_metadata as any)?.privacy_settings?.show_member_count ?? true,
        show_generation_info: (familyUnit.family_metadata as any)?.privacy_settings?.show_generation_info ?? true,
      },
      member_permissions: {
        can_invite_members: (familyUnit.family_metadata as any)?.member_permissions?.can_invite_members ?? false,
        can_share_family_cards: (familyUnit.family_metadata as any)?.member_permissions?.can_share_family_cards ?? true,
        can_view_all_members: (familyUnit.family_metadata as any)?.member_permissions?.can_view_all_members ?? true,
        require_approval_for_sharing: (familyUnit.family_metadata as any)?.member_permissions?.require_approval_for_sharing ?? false,
      },
      notification_settings: {
        notify_new_members: (familyUnit.family_metadata as any)?.notification_settings?.notify_new_members ?? true,
        notify_card_sharing: (familyUnit.family_metadata as any)?.notification_settings?.notify_card_sharing ?? false,
        notify_family_updates: (familyUnit.family_metadata as any)?.notification_settings?.notify_family_updates ?? true,
      },
    }
  });

  const handleSaveSettings = async (data: FamilySettingsFormData) => {
    if (!isOwner) return;

    setIsUpdating(true);
    try {
      const updatedMetadata = {
        ...(familyUnit.family_metadata as object || {}),
        description: data.description,
        privacy_settings: data.privacy_settings,
        member_permissions: data.member_permissions,
        notification_settings: data.notification_settings,
        updated_at: new Date().toISOString()
      };

      const success = await updateFamilyUnit(familyUnit.id, {
        family_label: data.family_label,
        family_metadata: updatedMetadata
      });

      if (success) {
        toast({
          title: "Settings updated",
          description: "Family unit settings have been saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error updating family settings:', error);
      toast({
        title: "Error updating settings",
        description: "Failed to save family settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeactivateFamily = async () => {
    if (!isOwner) return;

    const confirmed = window.confirm(
      `Are you sure you want to deactivate "${familyUnit.family_label}"? This action cannot be undone and will remove all family members and associated data.`
    );

    if (!confirmed) return;

    try {
      const success = await deactivateFamilyUnit(familyUnit.id);
      if (success) {
        toast({
          title: "Family unit deactivated",
          description: "The family unit has been permanently deactivated.",
        });
      }
    } catch (error) {
      console.error('Error deactivating family:', error);
      toast({
        title: "Error deactivating family",
        description: "Failed to deactivate family unit. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Family Settings
            {!isOwner && (
              <Badge variant="outline" className="text-xs">
                View Only
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
              
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="family_label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Family Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={!isOwner} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your family unit..."
                          {...field}
                          disabled={!isOwner}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional description to help family members understand the purpose of this unit.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              {/* Privacy Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Privacy Settings
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="privacy_settings.public_visibility"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Public Visibility</FormLabel>
                          <FormDescription className="text-sm">
                            Allow this family to be discovered by others
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="privacy_settings.allow_search"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Searchable</FormLabel>
                          <FormDescription className="text-sm">
                            Allow family to appear in search results
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="privacy_settings.show_member_count"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Member Count</FormLabel>
                          <FormDescription className="text-sm">
                            Display number of family members publicly
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="privacy_settings.show_generation_info"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Show Generation Info</FormLabel>
                          <FormDescription className="text-sm">
                            Display generation level information
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Member Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Member Permissions
                </h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="member_permissions.can_invite_members"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Can Invite Members</FormLabel>
                          <FormDescription className="text-sm">
                            Allow members to invite new family members
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="member_permissions.can_share_family_cards"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Can Share Family Cards</FormLabel>
                          <FormDescription className="text-sm">
                            Allow members to share cards with family
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="member_permissions.can_view_all_members"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Can View All Members</FormLabel>
                          <FormDescription className="text-sm">
                            Allow members to see all family members
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="member_permissions.require_approval_for_sharing"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>Require Sharing Approval</FormLabel>
                          <FormDescription className="text-sm">
                            Require trust anchor approval for card sharing
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!isOwner}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {isOwner && (
                <div className="flex gap-3">
                  <Button type="submit" disabled={isUpdating} className="flex-1">
                    {isUpdating ? 'Saving...' : 'Save Settings'}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDangerZone(!showDangerZone)}
              >
                {showDangerZone ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {showDangerZone && (
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border border-destructive/50 rounded-lg bg-destructive/5">
                  <h4 className="font-medium text-destructive mb-2">Deactivate Family Unit</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently deactivate this family unit. This will remove all members, 
                    delete family-specific cards, and cannot be undone.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleDeactivateFamily}
                    className="w-full"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Deactivate Family Unit
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default FamilySettings;