# Unified Photo System

## Overview
All user photos are now managed centrally through the Profile page, with intelligent tagging to control where photos appear throughout the application.

## Key Features

### 1. **Single Source of Truth**
- All photos stored in `profiles.profile_photos` (JSONB array)
- No duplicate photo storage or management
- Consistent photo experience across the app

### 2. **Smart Photo Tagging**
Each photo has metadata:
```typescript
interface ProfilePhoto {
  url: string;              // Photo URL in storage
  is_primary: boolean;      // Primary photo flag
  uploaded_at: string;      // Upload timestamp
  use_for: string[];        // ['profile', 'identity_card', 'both']
  description?: string;     // Optional description
}
```

### 3. **Usage Control**
Photos can be tagged for specific purposes:
- **Both**: Available for profile avatar and identity cards
- **Profile Only**: Only appears in profile contexts
- **Identity Cards Only**: Only appears in card selection

## User Workflow

### Managing Photos (Profile → Photos Tab)
1. Upload up to 5 photos via drag-and-drop or file selection
2. Set one photo as **Primary** (becomes profile avatar automatically)
3. Configure each photo's usage via settings icon:
   - Choose where photo appears (profile, cards, or both)
   - Add optional description
4. Delete photos as needed

### Using Photos in Identity Cards
1. When creating/editing a card with an image field:
   - **Option 1**: Upload a new file directly (traditional way)
   - **Option 2**: Click "Choose from Profile Photos"
2. Photo selector shows only photos tagged for identity card use
3. Select desired photo - it's linked (not copied)
4. Changes to the photo in profile automatically update card

## Technical Implementation

### Components
- **ProfilePhotoManager** (`src/components/ProfilePhotoManager.tsx`)
  - Upload/delete/organize photos
  - Edit photo metadata
  - Visual badges showing usage
  
- **PhotoSelector** (`src/components/PhotoSelector.tsx`)
  - Dialog for selecting photos in cards
  - Filters photos by `use_for` tag
  - Shows only identity_card-enabled photos

- **CardForm** (`src/components/CardForm.tsx`)
  - Integrated photo selector for image fields
  - Maintains backward compatibility with direct uploads

### Hooks
- **useProfile** (`src/hooks/useProfile.ts`)
  - `uploadProfilePhoto()` - Adds new photo
  - `deleteProfilePhoto()` - Removes photo
  - `setPrimaryPhoto()` - Sets primary & syncs avatar
  - `updatePhotoMetadata()` - Updates use_for tags

## Benefits

✅ **No Duplication**: Photos uploaded once, used anywhere
✅ **Automatic Sync**: Primary photo = avatar URL
✅ **Centralized Management**: One place to manage all photos
✅ **Flexible Control**: Choose where each photo appears
✅ **Better UX**: Quick photo selection from existing library
✅ **Storage Efficient**: Single copy per photo

## Migration Notes

- Existing photos continue to work (backward compatible)
- New photos default to `use_for: ['both']`
- Users can update existing photos via settings icon
- Direct file uploads still supported alongside photo selection
