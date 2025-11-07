# Media Upload Feature - Setup Instructions

This document describes the new media upload feature and setup instructions.

## Features Implemented

### Backend
1. **PostMedia Model** - Support for multiple images or single video per post
2. **Comments Toggle** - Admin can enable/disable comments on individual posts
3. **Media Type Detection** - Auto-detect image/video from file extension
4. **File Metadata** - Track file size, dimensions, duration, thumbnails

### Frontend
1. **Image Carousel** - Swipeable carousel for multiple images
2. **Video Player** - Custom video player with mute/unmute controls
3. **Comments Disabled State** - Show message when comments are turned off
4. **Backward Compatible** - Falls back to old single image field

## Database Migrations

### Run Migrations

```bash
cd backend
python manage.py makemigrations confessions
python manage.py migrate
```

### Migration Details

The migrations will:
- Add `comments_enabled` field to Post model (default: True)
- Create new `PostMedia` table with fields:
  - post (ForeignKey)
  - media_type (image/video)
  - file (FileField)
  - order (for carousel ordering)
  - thumbnail (for video previews)
  - duration, width, height, file_size
  - uploaded_at

## Usage

### Creating Posts with Media

**API Endpoint:** `POST /api/confessions/posts/`

**Request (multipart/form-data):**
```json
{
  "confession": 1,
  "title": "Post Title",
  "content": "Post content",
  "comments_enabled": true,
  "media_files_data": [file1, file2, file3]  // Array of image or video files
}
```

**Supported Media Types:**
- **Images:** .jpg, .jpeg, .png, .gif, .webp
- **Videos:** .mp4, .mov, .avi, .webm, .mkv

**Rules:**
- Multiple images allowed (carousel display)
- Only one video per post
- Either images OR video (not both)

### Admin Panel

Admins can now:
1. Toggle `comments_enabled` checkbox when creating/editing posts
2. View and manage media files in PostMedia admin
3. Reorder carousel images using the `order` field

### Frontend Components

**New Components:**
- `MediaCarousel.jsx` - Image carousel with navigation arrows and dots
- `VideoPlayer.jsx` - Video player with mute/unmute and play/pause controls

**Updated Components:**
- `PostCard.jsx` - Displays media from media_files or falls back to image field
- `CommentSection.jsx` - Shows disabled message when comments_enabled=false
- `PostDetails.jsx` - Passes comments_enabled to CommentSection

## Media Storage

Media files are stored in:
```
media/posts/media/YYYY/MM/DD/  # Main media files
media/posts/thumbnails/YYYY/MM/DD/  # Video thumbnails
```

## Optional: Image/Video Compression

For production, install compression libraries:

```bash
pip install Pillow  # Image compression
pip install ffmpeg-python  # Video compression
```

Then add compression logic in `PostCreateSerializer.create()` method.

## Testing

1. **Create a post with multiple images:**
   - Upload 2-3 images
   - Check carousel navigation works
   - Verify image quality

2. **Create a post with video:**
   - Upload a video file
   - Test mute/unmute button
   - Test play/pause functionality

3. **Test comments toggle:**
   - Create post with comments_enabled=False
   - Verify comment section shows disabled message
   - Re-enable and verify comments work

4. **Test backward compatibility:**
   - Old posts with single `image` field should still display
   - No errors when media_files is empty

## API Response Example

```json
{
  "id": 1,
  "title": "My Post",
  "content": "Content here",
  "comments_enabled": true,
  "media_files": [
    {
      "id": 1,
      "media_type": "image",
      "file": "/media/posts/media/2025/01/07/image1.jpg",
      "order": 0,
      "width": 1920,
      "height": 1080,
      "file_size": 245678
    },
    {
      "id": 2,
      "media_type": "image",
      "file": "/media/posts/media/2025/01/07/image2.jpg",
      "order": 1,
      "width": 1920,
      "height": 1080,
      "file_size": 198234
    }
  ]
}
```

## Future Enhancements

Potential improvements:
- Image compression on upload (using Pillow)
- Video transcoding to standard format (using FFmpeg)
- Video thumbnail generation
- Lazy loading for carousel images
- Swipe gestures for mobile carousel
- Progress bar for video playback
- Fullscreen mode for videos

## Troubleshooting

**Q: Migrations fail with "no module named django"**
A: Activate your virtual environment first

**Q: Media files not showing**
A: Check MEDIA_URL and MEDIA_ROOT in settings.py

**Q: Video not playing**
A: Ensure video format is supported by browsers (MP4/H.264 recommended)

**Q: Comments still showing when disabled**
A: Clear browser cache and ensure backend is returning comments_enabled field
