import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X, Star, StarOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfilePhoto {
  url: string;
  is_primary: boolean;
  uploaded_at: string;
}

interface ProfilePhotoManagerProps {
  photos: ProfilePhoto[];
  onUpload: (file: File) => Promise<string | null>;
  onDelete: (photoUrl: string) => Promise<boolean>;
  onSetPrimary: (photoUrl: string) => Promise<boolean>;
  maxPhotos?: number;
}

export const ProfilePhotoManager = ({
  photos,
  onUpload,
  onDelete,
  onSetPrimary,
  maxPhotos = 5
}: ProfilePhotoManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (photos.length >= maxPhotos) {
      toast({
        title: "Maximum photos reached",
        description: `You can only upload up to ${maxPhotos} photos.`,
        variant: "destructive"
      });
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive"
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <Card key={photo.url} className="relative group overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={photo.url}
                alt={`Profile photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant={photo.is_primary ? "default" : "secondary"}
                  onClick={() => onSetPrimary(photo.url)}
                  title={photo.is_primary ? "Primary photo" : "Set as primary"}
                >
                  {photo.is_primary ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={() => onDelete(photo.url)}
                  title="Delete photo"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {photo.is_primary && (
                <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-medium">
                  Primary
                </div>
              )}
            </div>
          </Card>
        ))}

        {photos.length < maxPhotos && (
          <Card className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer">
            <label className="aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer p-4">
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground text-center">
                {uploading ? 'Uploading...' : 'Upload Photo'}
              </span>
              <span className="text-xs text-muted-foreground">
                {photos.length}/{maxPhotos}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </Card>
        )}
      </div>

      {photos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No photos uploaded yet. Add up to {maxPhotos} photos to your profile.
        </p>
      )}
    </div>
  );
};
