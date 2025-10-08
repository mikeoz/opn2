import { supabase } from '@/integrations/supabase/client';

interface ProfilePhoto {
  url: string;
  is_primary: boolean;
  uploaded_at: string;
  use_for: string[];
  description?: string;
}

/**
 * Migrates card field images to the unified profile_photos system
 * This ensures existing card images are available in the profile photos library
 */
export const migrateCardImageToProfilePhotos = async (
  userId: string,
  imageUrl: string,
  description: string = 'Identity card photo'
): Promise<boolean> => {
  try {
    // Fetch current profile
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('profile_photos, avatar_url')
      .eq('id', userId)
      .single();

    if (fetchError || !profile) {
      console.error('Error fetching profile for migration:', fetchError);
      return false;
    }

    const photos: ProfilePhoto[] = profile.profile_photos 
      ? (Array.isArray(profile.profile_photos) ? profile.profile_photos : JSON.parse(profile.profile_photos as string))
      : [];

    // Check if this image is already in profile photos
    const existingPhoto = photos.find(p => p.url === imageUrl);
    if (existingPhoto) {
      console.log('Image already exists in profile_photos, skipping migration');
      return true;
    }

    // Don't exceed 5 photos limit
    if (photos.length >= 5) {
      console.log('Profile photos limit reached, cannot migrate');
      return false;
    }

    // Add the image to profile_photos
    const newPhoto: ProfilePhoto = {
      url: imageUrl,
      is_primary: photos.length === 0, // Set as primary if it's the first photo
      uploaded_at: new Date().toISOString(),
      use_for: ['identity_card', 'profile'], // Available for both
      description
    };

    const updatedPhotos = [...photos, newPhoto];

    // Update the profile
    const updateData: any = {
      profile_photos: updatedPhotos as any
    };

    // If this is the first photo, also set it as avatar_url
    if (photos.length === 0) {
      updateData.avatar_url = imageUrl;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating profile with migrated image:', updateError);
      return false;
    }

    console.log('Successfully migrated card image to profile_photos');
    return true;
  } catch (error) {
    console.error('Error in migrateCardImageToProfilePhotos:', error);
    return false;
  }
};

/**
 * Migrates multiple card images to profile_photos
 */
export const migrateMultipleCardImages = async (
  userId: string,
  imageUrls: string[]
): Promise<number> => {
  let successCount = 0;
  
  for (const imageUrl of imageUrls) {
    const success = await migrateCardImageToProfilePhotos(userId, imageUrl);
    if (success) successCount++;
  }

  return successCount;
};
