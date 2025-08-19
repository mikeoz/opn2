import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
      setProfile(data);
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
      const { error } = await supabase
        .from('profiles')
        .update(updates)
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
    refetch: fetchProfile
  };
};