import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Conversation, Message, MessageRead, MessageAttachment
from .serializers import MessageSerializer

User = get_user_model()


class ChatConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time messaging.
    Handles message sending, delivery receipts, read receipts, and typing indicators.
    """

    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope["user"]

        # Reject anonymous users
        if self.user.is_anonymous:
            await self.close()
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.conversation_group_name = f'chat_{self.conversation_id}'

        # Verify user is participant in conversation
        is_participant = await self.check_participant()
        if not is_participant:
            await self.close()
            return

        # Join conversation group
        await self.channel_layer.group_add(
            self.conversation_group_name,
            self.channel_name
        )

        await self.accept()

        # Send user joined notification
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'user_status',
                'user_id': self.user.id,
                'username': self.user.username,
                'status': 'online'
            }
        )

    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        if hasattr(self, 'conversation_group_name'):
            # Send user left notification
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'user_status',
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'status': 'offline'
                }
            )

            # Leave conversation group
            await self.channel_layer.group_discard(
                self.conversation_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')

            if message_type == 'chat_message':
                # Send message
                await self.handle_chat_message(data)
            elif message_type == 'typing':
                # Typing indicator
                await self.handle_typing(data)
            elif message_type == 'read_receipt':
                # Mark message as read
                await self.handle_read_receipt(data)
            elif message_type == 'edit_message':
                # Edit message
                await self.handle_edit_message(data)
            elif message_type == 'delete_message':
                # Delete message
                await self.handle_delete_message(data)
            elif message_type == 'pin_message':
                # Pin/unpin message
                await self.handle_pin_message(data)

        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON'
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def handle_chat_message(self, data):
        """Handle new chat message"""
        content = data.get('content', '').strip()
        reply_to_id = data.get('reply_to_id')

        if not content:
            return

        # Create message in database
        message = await self.create_message(content, reply_to_id)

        if message:
            # Serialize message
            message_data = await self.serialize_message(message)

            # Send message to conversation group
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'chat_message_handler',
                    'message': message_data
                }
            )

    async def handle_typing(self, data):
        """Handle typing indicator"""
        is_typing = data.get('is_typing', False)

        # Broadcast typing status to other users
        await self.channel_layer.group_send(
            self.conversation_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'username': self.user.username,
                'is_typing': is_typing
            }
        )

    async def handle_read_receipt(self, data):
        """Handle read receipt"""
        message_id = data.get('message_id')

        if message_id:
            await self.mark_message_as_read(message_id)

            # Broadcast read receipt
            await self.channel_layer.group_send(
                self.conversation_group_name,
                {
                    'type': 'read_receipt_handler',
                    'message_id': message_id,
                    'user_id': self.user.id,
                    'username': self.user.username,
                    'read_at': timezone.now().isoformat()
                }
            )

    async def handle_edit_message(self, data):
        """Handle message edit"""
        message_id = data.get('message_id')
        new_content = data.get('content', '').strip()

        if message_id and new_content:
            success, message = await self.edit_message(message_id, new_content)

            if success:
                message_data = await self.serialize_message(message)

                # Broadcast edited message
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'message_edited_handler',
                        'message': message_data
                    }
                )

    async def handle_delete_message(self, data):
        """Handle message deletion"""
        message_id = data.get('message_id')

        if message_id:
            success = await self.delete_message(message_id)

            if success:
                # Broadcast deletion
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'message_deleted_handler',
                        'message_id': message_id
                    }
                )

    async def handle_pin_message(self, data):
        """Handle message pin/unpin"""
        message_id = data.get('message_id')
        is_pinned = data.get('is_pinned', False)

        if message_id:
            success, message = await self.pin_message(message_id, is_pinned)

            if success:
                message_data = await self.serialize_message(message)

                # Broadcast pin status change
                await self.channel_layer.group_send(
                    self.conversation_group_name,
                    {
                        'type': 'message_pinned_handler',
                        'message': message_data
                    }
                )

    # Group message handlers (receive from channel layer)

    async def chat_message_handler(self, event):
        """Send chat message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message']
        }))

    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        # Don't send typing indicator to self
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'typing',
                'user_id': event['user_id'],
                'username': event['username'],
                'is_typing': event['is_typing']
            }))

    async def read_receipt_handler(self, event):
        """Send read receipt to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'read_receipt',
            'message_id': event['message_id'],
            'user_id': event['user_id'],
            'username': event['username'],
            'read_at': event['read_at']
        }))

    async def message_edited_handler(self, event):
        """Send edited message to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message_edited',
            'message': event['message']
        }))

    async def message_deleted_handler(self, event):
        """Send message deletion to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message_deleted',
            'message_id': event['message_id']
        }))

    async def message_pinned_handler(self, event):
        """Send message pin status to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'message_pinned',
            'message': event['message']
        }))

    async def user_status(self, event):
        """Send user status to WebSocket"""
        # Don't send own status to self
        if event['user_id'] != self.user.id:
            await self.send(text_data=json.dumps({
                'type': 'user_status',
                'user_id': event['user_id'],
                'username': event['username'],
                'status': event['status']
            }))

    # Database operations (sync to async)

    @database_sync_to_async
    def check_participant(self):
        """Check if user is participant in conversation"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)
            return conversation.participants.filter(id=self.user.id).exists()
        except Conversation.DoesNotExist:
            return False

    @database_sync_to_async
    def create_message(self, content, reply_to_id=None):
        """Create a new message"""
        try:
            conversation = Conversation.objects.get(id=self.conversation_id)

            reply_to = None
            if reply_to_id:
                reply_to = Message.objects.filter(id=reply_to_id).first()

            message = Message.objects.create(
                conversation=conversation,
                sender=self.user,
                content=content,
                reply_to=reply_to
            )

            # Create MessageRead records for other participants
            other_participants = conversation.participants.exclude(id=self.user.id)
            for participant in other_participants:
                MessageRead.objects.create(message=message, user=participant)

            # Update conversation's last_message_at
            conversation.last_message_at = timezone.now()
            conversation.save(update_fields=['last_message_at'])

            return message
        except Exception as e:
            print(f"Error creating message: {e}")
            return None

    @database_sync_to_async
    def serialize_message(self, message):
        """Serialize message to JSON"""
        from rest_framework.request import Request
        from django.test import RequestFactory

        factory = RequestFactory()
        request = factory.get('/')
        request.user = self.user

        serializer = MessageSerializer(message, context={'request': Request(request)})
        return serializer.data

    @database_sync_to_async
    def mark_message_as_read(self, message_id):
        """Mark message as read"""
        try:
            message = Message.objects.get(id=message_id)
            message_read, created = MessageRead.objects.get_or_create(
                message=message,
                user=self.user
            )

            if not message_read.read_at:
                message_read.mark_as_read()

            return True
        except Exception as e:
            print(f"Error marking message as read: {e}")
            return False

    @database_sync_to_async
    def edit_message(self, message_id, new_content):
        """Edit a message"""
        try:
            message = Message.objects.get(id=message_id)

            # Check permissions
            if message.sender != self.user:
                return False, None

            if not message.can_edit():
                return False, None

            message.content = new_content
            message.mark_as_edited()

            return True, message
        except Exception as e:
            print(f"Error editing message: {e}")
            return False, None

    @database_sync_to_async
    def delete_message(self, message_id):
        """Delete a message"""
        try:
            message = Message.objects.get(id=message_id)

            # Check permissions
            if message.sender != self.user:
                return False

            message.is_deleted = True
            message.save(update_fields=['is_deleted'])

            return True
        except Exception as e:
            print(f"Error deleting message: {e}")
            return False

    @database_sync_to_async
    def pin_message(self, message_id, is_pinned):
        """Pin or unpin a message"""
        try:
            message = Message.objects.get(id=message_id)
            conversation = message.conversation

            # Check permissions - only confession admin can pin
            if conversation.confession:
                if conversation.confession.admin != self.user and self.user.role != 'superadmin':
                    return False, None

            message.is_pinned = is_pinned
            message.save(update_fields=['is_pinned'])

            return True, message
        except Exception as e:
            print(f"Error pinning message: {e}")
            return False, None
