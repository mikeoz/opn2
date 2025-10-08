import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Upload, X, Star, StarOff, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfilePhoto {
  url: string;
  is_primary: boolean;
  uploaded_at: string;
  use_for: string[];
  description?: string;
}

interface ProfilePhotoManagerProps {
  photos: ProfilePhoto[];
  onUpload: (file: File) => Promise<string | null>;
  onDelete: (photoUrl: string) => Promise<boolean>;
  onSetPrimary: (photoUrl: string) => Promise<boolean>;
  onUpdateMetadata: (photoUrl: string, metadata: Partial<Pick<ProfilePhoto, 'use_for' | 'description'>>) => Promise<boolean>;
  maxPhotos?: number;
}

export const ProfilePhotoManager = ({
  photos,
  onUpload,
  onDelete,
  onSetPrimary,
  onUpdateMetadata,
  maxPhotos = 5
}: ProfilePhotoManagerProps) => {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<ProfilePhoto | null>(null);
  const { toast } = useToast();

  const validateAndUploadFile = async (file: File) => {
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
        description: "Please upload an image file (JPG, PNG).",
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
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    await validateAndUploadFile(file);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    await validateAndUploadFile(file);
  };

  const handleSaveMetadata = async () => {
    if (!editingPhoto) return;

    const success = await onUpdateMetadata(editingPhoto.url, {
      use_for: editingPhoto.use_for,
      description: editingPhoto.description
    });

    if (success) {
      setEditingPhoto(null);
    }
  };

  const getUsageBadges = (photo: ProfilePhoto) => {
    const badges = [];
    if (photo.use_for.includes('profile') || photo.use_for.includes('both')) {
      badges.push(<Badge key="profile" variant="secondary" className="text-xs">Profile</Badge>);
    }
    if (photo.use_for.includes('identity_card') || photo.use_for.includes('both')) {
      badges.push(<Badge key="card" variant="outline" className="text-xs">ID Card</Badge>);
    }
    return badges;
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <Card key={photo.url} className="relative group overflow-hidden">
            <div className="aspect-square relative">
              <img
                src={photo.url}
                alt={photo.description || `Profile photo ${index + 1}`}
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
                  variant="secondary"
                  onClick={() => setEditingPhoto(photo)}
                  title="Edit photo settings"
                >
                  <Settings className="w-4 h-4" />
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
              <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                {getUsageBadges(photo)}
              </div>
            </div>
          </Card>
        ))}

        {photos.length < maxPhotos && (
          <Card 
            className={`border-2 border-dashed transition-all cursor-pointer ${
              isDragging 
                ? 'border-primary bg-primary/10 scale-105' 
                : 'border-muted-foreground/25 hover:border-primary'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <label className="aspect-square flex flex-col items-center justify-center gap-2 cursor-pointer p-4">
              <Upload className={`w-8 h-8 transition-colors ${
                isDragging ? 'text-primary' : 'text-muted-foreground'
              }`} />
              <span className={`text-sm text-center font-medium transition-colors ${
                isDragging ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {uploading ? 'Uploading...' : isDragging ? 'Drop image here' : 'Drag & drop or click'}
              </span>
              <span className="text-xs text-muted-foreground">
                {photos.length}/{maxPhotos} • JPG, PNG • Max 5MB
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png"
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

      {/* Edit Photo Metadata Dialog */}
      <Dialog open={!!editingPhoto} onOpenChange={(open) => !open && setEditingPhoto(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Photo Settings</DialogTitle>
            <DialogDescription>
              Configure where this photo will be used
            </DialogDescription>
          </DialogHeader>
          {editingPhoto && (
            <div className="space-y-4">
              <div className="aspect-square w-48 mx-auto rounded-lg overflow-hidden">
                <img src={editingPhoto.url} alt="Preview" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-3">
                <Label>Use this photo for:</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="use-both"
                      checked={editingPhoto.use_for.includes('both')}
                      onCheckedChange={(checked) => {
                        setEditingPhoto({
                          ...editingPhoto,
                          use_for: checked ? ['both'] : []
                        });
                      }}
                    />
                    <Label htmlFor="use-both" className="font-normal cursor-pointer">
                      Both Profile & Identity Cards
                    </Label>
                  </div>
                  {!editingPhoto.use_for.includes('both') && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="use-profile"
                          checked={editingPhoto.use_for.includes('profile')}
                          onCheckedChange={(checked) => {
                            const newUseFor = checked
                              ? [...editingPhoto.use_for.filter(u => u !== 'both'), 'profile']
                              : editingPhoto.use_for.filter(u => u !== 'profile');
                            setEditingPhoto({ ...editingPhoto, use_for: newUseFor });
                          }}
                        />
                        <Label htmlFor="use-profile" className="font-normal cursor-pointer">
                          Profile Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="use-card"
                          checked={editingPhoto.use_for.includes('identity_card')}
                          onCheckedChange={(checked) => {
                            const newUseFor = checked
                              ? [...editingPhoto.use_for.filter(u => u !== 'both'), 'identity_card']
                              : editingPhoto.use_for.filter(u => u !== 'identity_card');
                            setEditingPhoto({ ...editingPhoto, use_for: newUseFor });
                          }}
                        />
                        <Label htmlFor="use-card" className="font-normal cursor-pointer">
                          Identity Cards Only
                        </Label>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="e.g., Professional headshot, Casual photo..."
                  value={editingPhoto.description || ''}
                  onChange={(e) => setEditingPhoto({
                    ...editingPhoto,
                    description: e.target.value
                  })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveMetadata} className="flex-1">
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => setEditingPhoto(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};