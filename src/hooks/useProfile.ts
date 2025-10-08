import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfilePhoto {
  url: string;
  is_primary: boolean;
  uploaded_at: string;
  use_for: string[]; // ['profile', 'identity_card', 'both']
  description?: string; // Optional description
}

interface Profile {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  account_type: 'individual' | 'non_individual';
  organization_name?: string;
  avatar_url?: string;
  logo_url?: string;
  guid: string;
  profile_photos?: ProfilePhoto[];
}

export const useProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      // Parse profile_photos from JSON
      const parsedData = {
        ...data,
        profile_photos: data.profile_photos 
          ? (Array.isArray(data.profile_photos) ? data.profile_photos : JSON.parse(data.profile_photos as string))
          : []
      };
      setProfile(parsedData as Profile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return false;

    try {
      // Convert profile_photos to JSON for storage if present
      const dbUpdates = {
        ...updates,
        profile_photos: updates.profile_photos ? JSON.stringify(updates.profile_photos) : undefined
      };

      const { error } = await supabase
        .from('profiles')
        .update(dbUpdates as any)
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
      return false;
    }
  };

  const validateImageFile = (file: File, maxSizeMB: number = 2): boolean => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPG, PNG, or SVG image.",
        variant: "destructive"
      });
      return false;
    }

    if (file.size > maxSizeBytes) {
      toast({
        title: "File too large",
        description: `Please upload an image smaller than ${maxSizeMB}MB.`,
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const uploadAvatar = async (file: File) => {
    if (!user || !validateImageFile(file)) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Remove old avatar if exists
      if (profile?.avatar_url) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/avatar.jpg`, `${user.id}/avatar.png`, `${user.id}/avatar.webp`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.svg`]);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const avatar_url = data.publicUrl;
      await updateProfile({ avatar_url });

      return avatar_url;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
      return null;
    }
  };

  const uploadLogo = async (file: File) => {
    if (!user || !validateImageFile(file)) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      // Remove old logo if exists
      if (profile?.logo_url) {
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/logo.jpg`, `${user.id}/logo.png`, `${user.id}/logo.webp`, `${user.id}/logo.jpeg`, `${user.id}/logo.svg`]);
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const logo_url = data.publicUrl;
      await updateProfile({ logo_url });

      toast({
        title: "Success",
        description: "Organization logo uploaded successfully"
      });

      return logo_url;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Error",
        description: "Failed to upload organization logo",
        variant: "destructive"
      });
      return null;
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Password updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Error",
        description: "Failed to change password",
        variant: "destructive"
      });
      return false;
    }
  };

  const uploadProfilePhoto = async (file: File) => {
    if (!user || !validateImageFile(file, 5)) return null;

    try {
      const photos = profile?.profile_photos || [];
      
      if (photos.length >= 5) {
        toast({
          title: "Maximum photos reached",
          description: "You can only have up to 5 profile photos.",
          variant: "destructive"
        });
        return null;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/photos/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const newPhoto: ProfilePhoto = {
        url: data.publicUrl,
        is_primary: photos.length === 0,
        uploaded_at: new Date().toISOString(),
        use_for: ['both'], // Default to both profile and cards
        description: ''
      };

      const updatedPhotos = [...photos, newPhoto];
      await updateProfile({ profile_photos: updatedPhotos });

      toast({
        title: "Success",
        description: "Photo uploaded successfully"
      });

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteProfilePhoto = async (photoUrl: string) => {
    if (!user) return false;

    try {
      const photos = profile?.profile_photos || [];
      const photoToDelete = photos.find(p => p.url === photoUrl);
      
      if (!photoToDelete) return false;

      // Extract file path from URL
      const urlParts = photoToDelete.url.split('/');
      const filePath = `${user.id}/photos/${urlParts[urlParts.length - 1]}`;

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatars')
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Update profile photos array
      let updatedPhotos = photos.filter(p => p.url !== photoUrl);
      
      // If deleted photo was primary, make the first photo primary
      if (photoToDelete.is_primary && updatedPhotos.length > 0) {
        updatedPhotos[0].is_primary = true;
      }

      await updateProfile({ profile_photos: updatedPhotos });

      toast({
        title: "Success",
        description: "Photo deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      toast({
        title: "Error",
        description: "Failed to delete photo",
        variant: "destructive"
      });
      return false;
    }
  };

  const setPrimaryPhoto = async (photoUrl: string) => {
    if (!user) return false;

    try {
      const photos = profile?.profile_photos || [];
      const updatedPhotos = photos.map(photo => ({
        ...photo,
        is_primary: photo.url === photoUrl
      }));

      // Update avatar_url to match primary photo
      const primaryPhoto = updatedPhotos.find(p => p.is_primary);
      const updateData: any = { profile_photos: updatedPhotos };
      if (primaryPhoto) {
        updateData.avatar_url = primaryPhoto.url;
      }

      await updateProfile(updateData);

      toast({
        title: "Success",
        description: "Primary photo updated"
      });

      return true;
    } catch (error) {
      console.error('Error setting primary photo:', error);
      toast({
        title: "Error",
        description: "Failed to update primary photo",
        variant: "destructive"
      });
      return false;
    }
  };

  const updatePhotoMetadata = async (photoUrl: string, metadata: Partial<Pick<ProfilePhoto, 'use_for' | 'description'>>) => {
    if (!user) return false;

    try {
      const photos = profile?.profile_photos || [];
      const updatedPhotos = photos.map(photo =>
        photo.url === photoUrl
          ? { ...photo, ...metadata }
          : photo
      );

      await updateProfile({ profile_photos: updatedPhotos });

      toast({
        title: "Success",
        description: "Photo metadata updated"
      });

      return true;
    } catch (error) {
      console.error('Error updating photo metadata:', error);
      toast({
        title: "Error",
        description: "Failed to update photo metadata",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  return {
    profile,
    loading,
    updateProfile,
    uploadAvatar,
    uploadLogo,
    changePassword,
    uploadProfilePhoto,
    deleteProfilePhoto,
    setPrimaryPhoto,
    updatePhotoMetadata,
    refetch: fetchProfile
  };
};