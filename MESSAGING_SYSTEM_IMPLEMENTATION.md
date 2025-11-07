# Direct Messaging System Implementation

## Overview

This document describes the implementation of a comprehensive direct messaging system for the religion platform. The system allows real-time communication between users and admins with extensive features including file sharing, message editing, pinning, replies, and read receipts.

## Features Implemented

### Core Messaging Features

1. **User-to-Admin Messaging**
   - Regular users can send messages only to admins of confessions they follow (subscribed to)
   - Admins can reply to those messages
   - Admins can chat with other admins freely

2. **Message Types**
   - Text messages
   - File attachments (images, videos, audio, PDF, DOC, and other formats)
   - Reply to specific messages with reference preview (Instagram-style)

3. **Message Management**
   - Messages can be edited within 10 minutes of being sent
   - Messages can be pinned (marked as important) by confession admins
   - Users can delete only their own messages (soft delete)

4. **Real-time Features**
   - WebSocket-based real-time messaging
   - Typing indicators
   - Online/offline status
   - Message status tracking (sent, delivered, seen)
   - Automatic read receipts

## Architecture

### Backend (Django)

#### Models (`backend/messaging/models.py`)

1. **Conversation**
   - Represents a chat between users
   - Fields: participants (M2M), created_at, updated_at, last_message_at, confession (FK, optional)
   - Methods: get_unread_count(), mark_as_read()

2. **Message**
   - Represents an individual message
   - Fields: conversation (FK), sender (FK), content, reply_to (FK self), is_edited, is_pinned, is_deleted, timestamps
   - Methods: can_edit(), mark_as_edited(), get_status_for_user()

3. **MessageRead**
   - Tracks read status for each user
   - Fields: message (FK), user (FK), delivered_at, read_at
   - Methods: mark_as_read()

4. **MessageAttachment**
   - Stores file attachments
   - Fields: message (FK), file, file_type, file_name, file_size, mime_type
   - Methods: determine_file_type()

#### API Endpoints

**Conversations** (`/api/messaging/conversations/`)
- `GET /` - List user's conversations
- `POST /` - Create new conversation
- `GET /:id/` - Get conversation details
- `POST /:id/mark_as_read/` - Mark all messages as read
- `GET /unread_count/` - Get total unread count
- `POST /get_or_create/` - Get or create conversation with specific user

**Messages** (`/api/messaging/messages/`)
- `GET /` - List messages (filtered by conversation)
- `POST /` - Send new message (supports file uploads)
- `PATCH /:id/` - Edit message (within 10 minutes)
- `DELETE /:id/` - Delete message (soft delete)
- `POST /:id/mark_as_read/` - Mark message as read
- `POST /:id/pin/` - Pin message
- `POST /:id/unpin/` - Unpin message

#### WebSocket Consumer (`backend/messaging/consumers.py`)

**ChatConsumer** handles:
- Real-time message sending/receiving
- Typing indicators
- Read receipts
- Message editing/deletion
- Message pinning
- User online/offline status

**WebSocket URL**: `ws://host:port/ws/chat/{conversation_id}/?token={jwt_token}`

**Message Types**:
- `chat_message` - New message
- `typing` - Typing indicator
- `read_receipt` - Mark as read
- `edit_message` - Edit message
- `delete_message` - Delete message
- `pin_message` - Pin/unpin message
- `user_status` - Online/offline status

#### Permissions (`backend/messaging/permissions.py`)

1. **IsConversationParticipant** - User must be participant in conversation
2. **IsMessageSender** - User must be sender for editing/deleting
3. **CanMessageUser** - Enforces messaging rules:
   - Regular users can only message admins of subscribed confessions
   - Admins can message anyone

### Frontend (React)

#### Components

1. **Messages** (`src/pages/Messages.jsx`)
   - Main messaging page
   - Shows conversation list and chat view

2. **ConversationList** (`src/components/messaging/ConversationList.jsx`)
   - Displays list of conversations
   - Shows unread counts and last message preview

3. **ChatView** (`src/components/messaging/ChatView.jsx`)
   - Main chat interface
   - Handles WebSocket connection
   - Manages message sending/receiving
   - Shows pinned messages

4. **MessageBubble** (`src/components/messaging/MessageBubble.jsx`)
   - Individual message display
   - Supports editing, deleting, pinning, replying
   - Shows message status and timestamps
   - Displays attachments

5. **MessageInput** (`src/components/messaging/MessageInput.jsx`)
   - Message composition area
   - File attachment support
   - Reply preview

#### State Management

**Messaging Store** (`src/store/messagingStore.js`) using Zustand:
- Conversations list
- Messages by conversation ID
- Current conversation
- Unread count
- WebSocket connections
- Typing indicators
- Online users

#### WebSocket Manager (`src/utils/websocket.js`)

Features:
- Automatic reconnection with exponential backoff
- Ping/pong for connection keep-alive
- Message queuing
- Connection state management

#### API Client (`src/api/messaging.js`)

Provides methods for:
- Conversation CRUD operations
- Message CRUD operations
- File uploads
- Read receipts

## Database Schema

```sql
-- Conversation table
CREATE TABLE messaging_conversation (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    last_message_at TIMESTAMP,
    confession_id INTEGER REFERENCES confessions_confession(id)
);

-- Conversation participants (M2M)
CREATE TABLE messaging_conversation_participants (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES messaging_conversation(id),
    user_id INTEGER REFERENCES accounts_user(id)
);

-- Message table
CREATE TABLE messaging_message (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES messaging_conversation(id) NOT NULL,
    sender_id INTEGER REFERENCES accounts_user(id) NOT NULL,
    content TEXT,
    reply_to_id INTEGER REFERENCES messaging_message(id),
    is_edited BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    edited_at TIMESTAMP
);

-- MessageRead table
CREATE TABLE messaging_messageread (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messaging_message(id) NOT NULL,
    user_id INTEGER REFERENCES accounts_user(id) NOT NULL,
    delivered_at TIMESTAMP NOT NULL,
    read_at TIMESTAMP,
    UNIQUE (message_id, user_id)
);

-- MessageAttachment table
CREATE TABLE messaging_messageattachment (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messaging_message(id) NOT NULL,
    file VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_at TIMESTAMP NOT NULL
);
```

## Setup and Configuration

### Backend Setup

1. **Install Dependencies**
```bash
pip install channels==4.0.0 channels-redis==4.1.0 redis==5.0.1 daphne==4.0.0
```

2. **Configure Settings** (`backend/religion_platform/settings.py`)
```python
INSTALLED_APPS = [
    'daphne',  # Must be before staticfiles
    # ... other apps
    'channels',
    'messaging',
]

ASGI_APPLICATION = 'religion_platform.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            "hosts": [('127.0.0.1', 6379)],
        },
    },
}
```

3. **Run Migrations**
```bash
python manage.py makemigrations messaging
python manage.py migrate messaging
```

4. **Start Redis Server**
```bash
redis-server
```

5. **Run Development Server**
```bash
python manage.py runserver
# OR for production
daphne -b 0.0.0.0 -p 8000 religion_platform.asgi:application
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd frontend
npm install zustand date-fns
```

2. **Environment Variables**
Create `.env` file:
```
VITE_API_URL=http://localhost:8000
VITE_WS_PORT=8000
```

3. **Run Development Server**
```bash
npm run dev
```

## Usage Examples

### Starting a Conversation (Frontend)

```javascript
import messagingAPI from './api/messaging';

// Get or create conversation with an admin
const conversation = await messagingAPI.getOrCreateConversation(
  adminUserId,  // Target admin's user ID
  confessionId  // Confession ID (optional)
);

// Navigate to conversation
navigate(`/messages/${conversation.id}`);
```

### Sending a Message

```javascript
// Text only
await messagingAPI.sendMessage({
  conversation: conversationId,
  content: 'Hello!',
});

// With attachments
const formData = new FormData();
formData.append('conversation', conversationId);
formData.append('content', 'Check this out!');
formData.append('attachment_files', file1);
formData.append('attachment_files', file2);

await messagingAPI.sendMessage(formData);
```

### WebSocket Messages

```javascript
// Connect to WebSocket
const ws = new WebSocketManager(conversationId, token, onMessage);
ws.connect();

// Send message via WebSocket
ws.sendMessage('Hello!');

// Send typing indicator
ws.sendTypingIndicator(true);

// Send read receipt
ws.sendReadReceipt(messageId);

// Edit message
ws.editMessage(messageId, 'Updated content');
```

## Access Control

### Messaging Permissions

1. **Regular Users**:
   - Can only message admins of confessions they are subscribed to
   - Cannot initiate conversations with other regular users
   - Can only message one admin at a time

2. **Admins**:
   - Can reply to any user who messages them
   - Can message other admins freely
   - Can pin/unpin messages in their confession conversations
   - Can manage conversations in their confessions

3. **Superadmins**:
   - Have all admin permissions
   - Can message anyone
   - Can pin/unpin any message

### Message Permissions

- **Edit**: Only sender, within 10 minutes of creation
- **Delete**: Only sender (soft delete)
- **Pin**: Only confession admin or superadmin
- **Reply**: Any conversation participant

## Testing

### Manual Testing Checklist

- [ ] Regular user can start conversation with admin of subscribed confession
- [ ] Regular user cannot message admin of non-subscribed confession
- [ ] Regular user cannot message other regular users
- [ ] Admin can reply to user messages
- [ ] Admin can message other admins
- [ ] Messages are delivered in real-time via WebSocket
- [ ] File attachments upload and display correctly
- [ ] Message editing works within 10-minute window
- [ ] Message editing disabled after 10 minutes
- [ ] Messages can be deleted by sender
- [ ] Messages can be pinned by confession admin
- [ ] Reply functionality works with preview
- [ ] Typing indicators appear in real-time
- [ ] Read receipts update message status
- [ ] Unread count updates correctly
- [ ] Conversation list sorts by last message time
- [ ] WebSocket reconnects automatically on disconnect

### API Testing

```bash
# Test conversation creation
curl -X POST http://localhost:8000/api/messaging/conversations/get_or_create/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_user_id": 2, "confession_id": 1}'

# Test message sending
curl -X POST http://localhost:8000/api/messaging/messages/ \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "conversation=1" \
  -F "content=Hello!" \
  -F "attachment_files=@/path/to/file.pdf"
```

## Performance Considerations

1. **Database Indexes**: All foreign keys and frequently queried fields are indexed
2. **Query Optimization**: Uses select_related() and prefetch_related() to minimize database queries
3. **WebSocket Scaling**: Redis channel layer supports horizontal scaling
4. **Message Pagination**: API returns paginated results
5. **Soft Deletes**: Messages are soft-deleted for performance and data retention

## Security Considerations

1. **JWT Authentication**: WebSocket connections require valid JWT token
2. **Permission Checks**: All operations validate user permissions
3. **File Upload Validation**: File types and sizes are validated
4. **XSS Prevention**: All user content is escaped in frontend
5. **Rate Limiting**: Consider adding rate limiting for message sending
6. **CORS Configuration**: Properly configured for WebSocket connections

## Future Enhancements

1. **Message Search**: Full-text search across messages
2. **Message Reactions**: Emoji reactions to messages
3. **Voice/Video Calls**: WebRTC integration
4. **Group Conversations**: Multi-party conversations beyond admin chat
5. **Message Forwarding**: Forward messages to other conversations
6. **Media Gallery**: View all media in a conversation
7. **Message Encryption**: End-to-end encryption for sensitive conversations
8. **Push Notifications**: Browser/mobile push notifications for new messages
9. **Message Templates**: Pre-defined message templates for admins
10. **Analytics**: Message statistics and insights for admins

## Troubleshooting

### WebSocket Connection Issues

**Problem**: WebSocket fails to connect
- Ensure Redis is running: `redis-cli ping`
- Check ASGI application is running with Daphne
- Verify JWT token is valid and not expired
- Check CORS settings for WebSocket origin

**Problem**: Messages not appearing in real-time
- Check browser console for WebSocket errors
- Verify user is authenticated
- Check channel layer configuration
- Ensure conversation participants are correct

### File Upload Issues

**Problem**: File uploads fail
- Check MEDIA_ROOT and MEDIA_URL configuration
- Verify file size limits
- Check file type is supported
- Ensure multipart/form-data header is set

## Conclusion

The messaging system provides a comprehensive, real-time communication platform with enterprise-grade features. It follows best practices for security, performance, and user experience while maintaining scalability for future growth.

## Contact

For questions or issues, please create an issue in the project repository.
