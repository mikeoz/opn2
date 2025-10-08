import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Image, Check } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface ProfilePhoto {
  url: string;
  is_primary: boolean;
  uploaded_at: string;
  use_for: string[];
  description?: string;
}

interface PhotoSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (photoUrl: string) => void;
  currentPhotoUrl?: string;
}

export const PhotoSelector = ({ open, onOpenChange, onSelect, currentPhotoUrl }: PhotoSelectorProps) => {
  const { profile } = useProfile();
  const [selectedUrl, setSelectedUrl] = useState<string>(currentPhotoUrl || '');

  // Filter photos that can be used for identity cards
  const availablePhotos = (profile?.profile_photos || []).filter(
    (photo: ProfilePhoto) => photo.use_for.includes('identity_card') || photo.use_for.includes('both')
  );

  const handleSelect = () => {
    onSelect(selectedUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Select Photo</DialogTitle>
          <DialogDescription>
            Choose a photo from your profile photos for this card
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {availablePhotos.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No photos available for identity cards.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload photos in your Profile → Photos tab and mark them for use in identity cards.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                {availablePhotos.map((photo: ProfilePhoto) => (
                  <Card
                    key={photo.url}
                    className={`relative cursor-pointer transition-all ${
                      selectedUrl === photo.url 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:ring-2 hover:ring-muted-foreground/50'
                    }`}
                    onClick={() => setSelectedUrl(photo.url)}
                  >
                    <div className="aspect-square relative overflow-hidden rounded-md">
                      <img
                        src={photo.url}
                        alt={photo.description || 'Profile photo'}
                        className="w-full h-full object-cover"
                      />
                      {selectedUrl === photo.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-2">
                            <Check className="w-5 h-5" />
                          </div>
                        </div>
                      )}
                      {photo.is_primary && (
                        <Badge className="absolute top-2 right-2 text-xs">
                          Primary
                        </Badge>
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
                <Button onClick={handleSelect} disabled={!selectedUrl} className="flex-1">
                  Use Selected Photo
                </Button>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};