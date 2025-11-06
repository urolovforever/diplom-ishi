# Notification System Implementation

## Overview

A comprehensive notification system has been implemented for Confession Admins to receive alerts when users interact with their confessions.

---

## Backend Implementation

### 1. Database Model

**File:** `backend/confessions/models.py`

Created `Notification` model with the following fields:
- `recipient` (ForeignKey): Admin who receives the notification
- `actor` (ForeignKey): User who triggered the action
- `notification_type` (CharField): Type of notification (subscribe, like, comment)
- `confession` (ForeignKey): Related confession
- `post` (ForeignKey, optional): Related post for like/comment notifications
- `comment` (ForeignKey, optional): Related comment for comment notifications
- `is_read` (BooleanField): Read status
- `created_at` (DateTimeField): Timestamp

Database indexes added for performance:
- `recipient` + `created_at`
- `recipient` + `is_read`

### 2. Admin Interface

**File:** `backend/confessions/admin.py`

Registered `Notification` model with admin interface featuring:
- List display with filtering by type, read status, and date
- Search by recipient, actor, and confession
- Inline editing of read status

### 3. API Serializer

**File:** `backend/confessions/serializers.py`

Created `NotificationSerializer` with:
- User-friendly message generation based on notification type
- Automatic link generation to related content
- Human-readable time display (e.g., "2 hours ago")
- Minimal nested serialization for actor, confession, and post

### 4. Views and Endpoints

**File:** `backend/confessions/views.py`

Created `NotificationViewSet` with the following endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/` | GET | List all notifications for admin |
| `/api/notifications/{id}/` | GET | Get specific notification |
| `/api/notifications/unread_count/` | GET | Get count of unread notifications |
| `/api/notifications/{id}/mark_read/` | POST | Mark single notification as read |
| `/api/notifications/mark_all_read/` | POST | Mark all notifications as read |

**Notification Triggers Added:**

1. **Subscribe Action** (`ConfessionViewSet.subscribe`):
   - Creates notification when user subscribes to a confession
   - Only if admin exists and is not the actor

2. **Like Action** (`PostViewSet.like`):
   - Creates notification when user likes a post
   - Only if confession admin exists and is not the actor

3. **Comment Creation** (`CommentViewSet.perform_create`):
   - Creates notification when user comments on a post
   - Only if confession admin exists and is not the actor

### 5. URL Configuration

**File:** `backend/confessions/urls.py`

Registered `NotificationViewSet` with router:
```python
router.register('notifications', NotificationViewSet, basename='notification')
```

---

## Frontend Implementation

### 1. API Service

**File:** `frontend/src/api/notification.js`

Created notification API client with methods:
- `getNotifications()` - Fetch all notifications
- `getUnreadCount()` - Get unread count
- `markNotificationAsRead(id)` - Mark single as read
- `markAllNotificationsAsRead()` - Mark all as read

### 2. Notifications Sidebar Component

**File:** `frontend/src/components/NotificationsSidebar.jsx`

Features:
- Slides in from right side of screen
- Dark overlay when open
- Displays list of notifications with:
  - Actor username and avatar
  - Notification message (auto-generated)
  - Confession name
  - Time ago
  - Visual indicator for unread notifications
- Click notification to:
  - Mark as read
  - Navigate to related content
- "Mark all as read" button
- Loading state and empty state

### 3. Left Sidebar Integration

**File:** `frontend/src/components/layout/LeftSidebar.jsx`

Enhanced with:
- Notification bell icon with badge showing unread count
- Badge displays count (1-9) or "9+" for higher counts
- Auto-refresh of unread count every 30 seconds
- Click bell to open notifications sidebar
- Only visible to admin and superadmin users

---

## Features

### ✅ Notification Triggers

1. **Subscribe Notification**
   - When: User subscribes to a confession
   - Message: "@username followed your confession."
   - Link: `/confession/{slug}`

2. **Like Notification**
   - When: User likes a post
   - Message: "@username liked your post 'Post Title'."
   - Link: `/post/{id}`

3. **Comment Notification**
   - When: User comments on a post
   - Message: "@username commented on your post 'Post Title'."
   - Link: `/post/{id}`

### ✅ Visibility & Permissions

- Only visible to users with `admin` or `superadmin` role
- Each admin only sees notifications for their managed confessions
- Regular users cannot access notification endpoints

### ✅ UI/UX Features

- **Bell Icon**: Left sidebar with visual badge
- **Badge Count**: Shows unread count (1-9 or 9+)
- **Real-time Updates**: Polls every 30 seconds
- **Right Sidebar**: Smooth slide-in animation
- **Unread Indicators**: Blue background and dot for unread
- **Time Display**: Human-readable (e.g., "2 hours ago")
- **Click Actions**: Mark as read and navigate
- **Bulk Actions**: Mark all as read

---

## Database Migrations

Created migration file:
- `backend/confessions/migrations/0003_notification.py`

To apply migrations:
```bash
source venv/bin/activate
cd backend
python manage.py migrate
```

---

## API Examples

### Get Notifications
```bash
GET /api/notifications/
Authorization: Bearer <token>

Response:
{
  "results": [
    {
      "id": 1,
      "actor": {
        "id": 2,
        "username": "nizomjon",
        "avatar": "/media/avatars/user.jpg"
      },
      "notification_type": "subscribe",
      "confession": {
        "id": 1,
        "name": "Islam",
        "slug": "islam"
      },
      "post": null,
      "message": "@nizomjon followed your confession.",
      "link": "/confession/islam",
      "is_read": false,
      "created_at": "2025-11-06T10:30:00Z",
      "time_ago": "2 hours ago"
    }
  ]
}
```

### Get Unread Count
```bash
GET /api/notifications/unread_count/
Authorization: Bearer <token>

Response:
{
  "count": 5
}
```

### Mark as Read
```bash
POST /api/notifications/1/mark_read/
Authorization: Bearer <token>

Response:
{
  "message": "Notification marked as read"
}
```

---

## Testing Checklist

### Backend Testing
- [ ] Create test user with admin role
- [ ] Assign admin to a confession
- [ ] Test subscribe trigger (another user subscribes)
- [ ] Test like trigger (another user likes a post)
- [ ] Test comment trigger (another user comments)
- [ ] Verify notifications API returns correct data
- [ ] Test marking single notification as read
- [ ] Test marking all notifications as read
- [ ] Test unread count endpoint
- [ ] Verify regular users cannot access notifications

### Frontend Testing
- [ ] Login as admin user
- [ ] Verify bell icon appears in left sidebar
- [ ] Check badge shows correct unread count
- [ ] Click bell to open notifications sidebar
- [ ] Verify notifications display correctly
- [ ] Click notification to navigate
- [ ] Test mark as read functionality
- [ ] Test mark all as read
- [ ] Verify badge updates after marking as read
- [ ] Test auto-refresh (wait 30 seconds)

---

## Future Enhancements (Optional)

1. **Real-time Notifications**: Implement WebSocket for instant updates
2. **Email Notifications**: Send email alerts for important actions
3. **Notification Preferences**: Allow admins to customize notification types
4. **Notification History**: Archive and search old notifications
5. **Push Notifications**: Browser push notifications for desktop
6. **Notification Groups**: Group similar notifications together
7. **Rich Content**: Show thumbnails for images in posts
8. **Notification Sounds**: Audio alerts for new notifications

---

## Files Changed/Created

### Backend
- ✅ `backend/confessions/models.py` - Added Notification model
- ✅ `backend/confessions/admin.py` - Registered Notification admin
- ✅ `backend/confessions/serializers.py` - Added NotificationSerializer
- ✅ `backend/confessions/views.py` - Added NotificationViewSet and triggers
- ✅ `backend/confessions/urls.py` - Registered notification routes
- ✅ `backend/confessions/migrations/0003_notification.py` - Database migration

### Frontend
- ✅ `frontend/src/api/notification.js` - Notification API client
- ✅ `frontend/src/components/NotificationsSidebar.jsx` - Notifications sidebar
- ✅ `frontend/src/components/layout/LeftSidebar.jsx` - Added bell icon with badge

---

## Summary

The notification system is fully implemented and ready for testing. Confession admins will now receive real-time notifications when users:
- Subscribe to their confession
- Like posts in their confession
- Comment on posts in their confession

The system includes a clean UI with a bell icon, badge counter, and a sliding notifications sidebar with all the requested features.
