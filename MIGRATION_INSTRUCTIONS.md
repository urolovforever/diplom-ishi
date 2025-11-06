# Database Migration Instructions

## After pulling these changes, run the following commands:

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

## Changes Made

### Comment System Enhancements

1. **Comment Model** - Added nested reply support:
   - `parent` field - links to parent comment for threading
   - `likes_count` property - count of likes on comment
   - `replies_count` property - count of replies to comment

2. **CommentLike Model** - New model for liking comments:
   - `user` - user who liked
   - `comment` - comment that was liked
   - Unique constraint on (user, comment)

### API Endpoints

**Comment Endpoints:**
- `GET /api/comments/?post=<id>` - Get top-level comments for a post
- `POST /api/comments/` - Create comment or reply (include `parent` field for replies)
- `POST /api/comments/<id>/like/` - Like a comment
- `POST /api/comments/<id>/unlike/` - Unlike a comment
- `GET /api/comments/<id>/replies/` - Get all replies for a comment

### Frontend Integration

Comment data now includes:
```json
{
  "id": 1,
  "post": 1,
  "parent": null,
  "author": {...},
  "content": "Comment text",
  "likes_count": 5,
  "replies_count": 3,
  "is_liked": false,
  "replies": [...],
  "created_at": "...",
  "updated_at": "..."
}
```
