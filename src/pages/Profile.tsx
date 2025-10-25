import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Camera, Save, Lock, User, Building2, Check } from 'lucide-react';
import MobileLayout from '@/components/MobileLayout';
import OrganizationBrandingSettings from '@/components/OrganizationBrandingSettings';
import OrganizationManagement from '@/components/OrganizationManagement';
import { useProfile } from '@/hooks/useProfile';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { ProfilePhotoManager } from '@/components/ProfilePhotoManager';

const Profile = () => {
  const { 
    profile, 
    loading, 
    updateProfile, 
    uploadAvatar, 
    changePassword,
    uploadProfilePhoto,
    deleteProfilePhoto,
    setPrimaryPhoto,
    updatePhotoMetadata
  } = useProfile();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    organization_name: ''
  });
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPhotoSelector, setShowPhotoSelector] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        organization_name: profile.organization_name || ''
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    await uploadAvatar(file);
  };

  const handleSaveProfile = async () => {
    const success = await updateProfile(formData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive"
      });
      return;
    }

    const success = await changePassword(passwordData.newPassword);
    if (success) {
      setPasswordData({ newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
    }
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Loading profile...</div>
        </div>
      </MobileLayout>
    );
  }

  if (!profile) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Profile Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Unable to load profile data.</p>
            </CardContent>
          </Card>
        </div>
      </MobileLayout>
    );
  }

  const getInitials = () => {
    const first = profile.first_name?.[0] || '';
    const last = profile.last_name?.[0] || '';
    return (first + last) || profile.username?.[0] || profile.email[0];
  };

  const getRoleDisplay = () => {
    if (isAdmin) return 'Admin';
    if (profile.account_type === 'non_individual') return 'Organization';
    return 'Member';
  };

  return (
    <MobileLayout>
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Profile Settings</h1>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={`grid w-full ${profile.account_type === 'non_individual' ? 'grid-cols-5' : 'grid-cols-3'}`}>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            {profile.account_type === 'non_individual' && (
              <>
                <TabsTrigger value="branding">Branding</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Avatar Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profile Picture
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage 
                      src={
                        profile.profile_photos?.find(p => p.is_primary)?.url || 
                        profile.avatar_url
                      } 
                      alt="Profile" 
                    />
                    <AvatarFallback className="text-lg">
                      {getInitials().toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90"
                    onClick={() => setShowPhotoSelector(true)}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Click the camera icon to select from your Photo Library
                </p>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Profile Information
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    {isEditing ? 'Cancel' : 'Edit'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  {isEditing ? (
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter username"
                    />
                  ) : (
                    <p className="text-sm font-medium">{profile.username}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>First Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.first_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
                        placeholder="First name"
                      />
                    ) : (
                      <p className="text-sm">{profile.first_name || 'Not set'}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Last Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.last_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
                        placeholder="Last name"
                      />
                    ) : (
                      <p className="text-sm">{profile.last_name || 'Not set'}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Badge variant={isAdmin ? "default" : "secondary"}>
                    {getRoleDisplay()}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label>Account Type</Label>
                  <p className="text-sm">
                    {profile.account_type === 'individual' ? 'Individual' : 'Organization'}
                  </p>
                </div>

                {profile.account_type === 'non_individual' && (
                  <div className="space-y-2">
                    <Label>Organization Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.organization_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, organization_name: e.target.value }))}
                        placeholder="Organization name"
                      />
                    ) : (
                      <p className="text-sm">{profile.organization_name || 'Not set'}</p>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>User ID (GUID)</Label>
                  <p className="text-xs text-muted-foreground font-mono">{profile.guid}</p>
                </div>

                {isEditing && (
                  <Button onClick={handleSaveProfile} className="w-full">
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="photos" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  Profile Photos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfilePhotoManager
                  photos={profile.profile_photos || []}
                  onUpload={uploadProfilePhoto}
                  onDelete={deleteProfilePhoto}
                  onSetPrimary={setPrimaryPhoto}
                  onUpdateMetadata={updatePhotoMetadata}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Password Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Password & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="w-full"
                >
                  {showPasswordForm ? 'Cancel' : 'Change Password'}
                </Button>

                {showPasswordForm && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Confirm Password</Label>
                        <Input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <Button onClick={handlePasswordChange} className="w-full">
                        Update Password
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Additional Security Information */}
            <Card>
              <CardHeader>
                <CardTitle>Account Security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Two-Factor Authentication</span>
                  <Badge variant="outline">Not Configured</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Last Login</span>
                  <span className="text-sm text-muted-foreground">Current session</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  For enhanced security, consider enabling two-factor authentication when available.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {profile.account_type === 'non_individual' && (
            <>
              <TabsContent value="branding" className="space-y-6">
                <OrganizationBrandingSettings />
              </TabsContent>

              <TabsContent value="team" className="space-y-6">
                <OrganizationManagement />
              </TabsContent>
            </>
          )}
        </Tabs>

        {/* Photo Library Selector Dialog */}
        <Dialog open={showPhotoSelector} onOpenChange={setShowPhotoSelector}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Select Profile Photo</DialogTitle>
              <DialogDescription>
                Choose a photo from your Photo Library to use as your profile picture
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {(!profile.profile_photos || profile.profile_photos.length === 0) ? (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No photos in your Photo Library yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Go to the Photos tab to upload photos to your library.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {profile.profile_photos.map((photo: any) => (
                      <Card
                        key={photo.url}
                        className={`relative cursor-pointer transition-all ${
                          photo.is_primary
                            ? 'ring-2 ring-primary ring-offset-2' 
                            : 'hover:ring-2 hover:ring-muted-foreground/50'
                        }`}
                        onClick={async () => {
                          await setPrimaryPhoto(photo.url);
                          setShowPhotoSelector(false);
                          toast({
                            title: "Success",
                            description: "Profile photo updated"
                          });
                        }}
                      >
                        <div className="aspect-square relative overflow-hidden rounded-md">
                          <img
                            src={photo.url}
                            alt={photo.description || 'Profile photo'}
                            className="w-full h-full object-cover"
                          />
                          {photo.is_primary && (
                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                              <div className="bg-primary text-primary-foreground rounded-full p-2">
                                <Check className="w-5 h-5" />
                              </div>
                            </div>
                          )}
                        </div>
                        {photo.description && (
                          <p className="text-xs text-muted-foreground p-2 truncate">
                            {photo.description}
                          </p>
                        )}
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowPhotoSelector(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MobileLayout>
  );
};

export default Profile;