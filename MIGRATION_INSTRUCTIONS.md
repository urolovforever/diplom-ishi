# Database Migration Instructions

## ⚠️ IMPORTANT: After pulling these changes, run the following commands:

### Backend (Django)

```bash
cd backend

# Activate virtual environment if you have one
# source venv/bin/activate  # Linux/Mac
# or
# venv\Scripts\activate  # Windows

# Create and run migrations
python manage.py makemigrations
python manage.py migrate
```

---

## 📋 Changes Made

### Phase 1: Basic Threading (Initial)

1. **Comment Model** - Added nested reply support:
   - `parent` field - links to parent comment for threading
   - `likes_count` property - count of likes on comment
   - `replies_count` property - count of replies to comment

2. **CommentLike Model** - New model for liking comments:
   - `user` - user who liked
   - `comment` - comment that was liked
   - Unique constraint on (user, comment)

### Phase 2: Enhanced Features (Latest) ✨

**Comment Model Updates:**
- `is_pinned` (BooleanField) - Admin can pin important comments
- `is_edited` (BooleanField) - Tracks if comment has been edited
- Updated ordering: `-is_pinned, -created_at` (pinned comments first)

---

## 🔌 API Endpoints

**Comment Endpoints:**
- `GET /api/comments/?post=<id>` - Get top-level comments for a post
- `POST /api/comments/` - Create comment or reply (include `parent` field for replies)
- `PATCH /api/comments/<id>/` - Edit a comment (marks as edited)
- `DELETE /api/comments/<id>/` - Delete comment and all replies
- `POST /api/comments/<id>/like/` - Like a comment
- `POST /api/comments/<id>/unlike/` - Unlike a comment
- `POST /api/comments/<id>/pin/` - Pin comment (admin only)
- `POST /api/comments/<id>/unpin/` - Unpin comment (admin only)
- `GET /api/comments/<id>/replies/` - Get all replies for a comment

---

## 📦 Comment Data Structure

```json
{
  "id": 1,
  "post": 1,
  "parent": null,
  "author": {
    "id": 1,
    "username": "john_doe",
    "avatar": "https://..."
  },
  "content": "Comment text",
  "likes_count": 5,
  "replies_count": 3,
  "is_liked": false,
  "is_pinned": false,
  "is_edited": false,
  "replies": [
    {
      "id": 2,
      "parent": 1,
      "content": "Reply text",
      "replies": [...]  // Unlimited nesting!
    }
  ],
  "created_at": "2024-01-01T12:00:00Z",
  "updated_at": "2024-01-01T12:05:00Z"
}
```

---

## ✨ New Features

### 1. **Unlimited Nested Replies**
- Reply to any comment at any depth
- No 1-level limit anymore
- Fully recursive threading

### 2. **Edit Comments**
- Users can edit their own comments
- Shows "edited" label after editing
- `PATCH /api/comments/<id>/` with `{ "content": "new text" }`

### 3. **Pin Comments**
- Admins can pin important comments
- Pinned comments appear at top with 📌 icon
- Only confession admin or superadmin can pin

### 4. **Collapse/Expand Replies**
- "View X replies" button to expand
- "Hide replies" button to collapse
- Smooth fade-in animations

### 5. **URL Auto-Linking**
- URLs in comments become clickable links
- Opens in new tab
- Blue color and underline on hover

### 6. **Better Animations**
- Heart animation on like
- Smooth fade-in for reply forms
- Scale effect on buttons
- Smooth collapse/expand transitions

---

## 🎨 UI Features

- Instagram-style clean design
- Circular avatars with gradient fallbacks
- "edited" label for modified comments
- "📌 Pinned" badge for pinned comments
- Smooth transitions and animations
- Better visual hierarchy
- Responsive layout
