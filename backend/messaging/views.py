from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Max
from django.contrib.auth import get_user_model

from .models import Conversation, Message, MessageRead, MessageAttachment
from .serializers import (
    ConversationSerializer,
    ConversationListSerializer,
    MessageSerializer,
    MessageAttachmentSerializer
)
from .permissions import IsConversationParticipant, IsMessageSender, CanMessageUser
from confessions.models import Confession

User = get_user_model()


class ConversationViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing conversations.
    """
    permission_classes = [IsAuthenticated, CanMessageUser]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        """Get conversations where user is a participant"""
        return Conversation.objects.filter(
            participants=self.request.user
        ).prefetch_related(
            'participants',
            'messages'
        ).annotate(
            last_msg_time=Max('messages__created_at')
        ).order_by('-last_msg_time', '-updated_at')

    def get_serializer_class(self):
        """Use simplified serializer for list view"""
        if self.action == 'list':
            return ConversationListSerializer
        return ConversationSerializer

    def create(self, request, *args, **kwargs):
        """
        Create a new conversation.
        Validates permissions based on user role and subscription.
        """
        participant_ids = request.data.get('participant_ids', [])
        confession_id = request.data.get('confession')

        # Validate permissions for regular users
        if request.user.role == 'user':
            # Regular users can only message one person at a time (the admin)
            if len(participant_ids) != 1:
                return Response(
                    {'error': 'You can only message one admin at a time.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if the target user is an admin
            target_user = User.objects.filter(id=participant_ids[0]).first()
            if not target_user or target_user.role not in ['admin', 'superadmin']:
                return Response(
                    {'error': 'You can only message admins.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            # If confession is specified, check if user is subscribed
            if confession_id:
                try:
                    confession = Confession.objects.get(id=confession_id)
                    if not confession.subscribers.filter(user=request.user).exists():
                        return Response(
                            {'error': 'You must be subscribed to this confession to message its admin.'},
                            status=status.HTTP_403_FORBIDDEN
                        )

                    # Check if target user is the admin of this confession
                    if confession.admin != target_user:
                        return Response(
                            {'error': 'The selected user is not the admin of this confession.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except Confession.DoesNotExist:
                    return Response(
                        {'error': 'Confession not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )

            # Check if conversation already exists
            existing_conversation = Conversation.objects.filter(
                participants=request.user
            ).filter(
                participants__id=target_user.id
            ).filter(confession_id=confession_id).first()

            if existing_conversation:
                return Response(
                    ConversationSerializer(existing_conversation, context={'request': request}).data,
                    status=status.HTTP_200_OK
                )

        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark all messages in conversation as read"""
        conversation = self.get_object()
        conversation.mark_as_read(request.user)
        return Response({'status': 'Messages marked as read'})

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get total unread message count across all conversations"""
        conversations = self.get_queryset()
        total_unread = sum(conv.get_unread_count(request.user) for conv in conversations)
        return Response({'unread_count': total_unread})

    @action(detail=False, methods=['post'])
    def get_or_create(self, request):
        """
        Get or create a conversation with specific user(s).
        Used by frontend to start a new conversation.
        """
        target_user_id = request.data.get('target_user_id')
        confession_id = request.data.get('confession_id')

        if not target_user_id:
            return Response(
                {'error': 'target_user_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate permissions (same logic as create)
        if request.user.role == 'user':
            target_user = User.objects.filter(id=target_user_id).first()
            if not target_user or target_user.role not in ['admin', 'superadmin']:
                return Response(
                    {'error': 'You can only message admins.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if confession_id:
                try:
                    confession = Confession.objects.get(id=confession_id)
                    if not confession.subscribers.filter(user=request.user).exists():
                        return Response(
                            {'error': 'You must be subscribed to this confession.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                    if confession.admin.id != target_user_id:
                        return Response(
                            {'error': 'User is not the admin of this confession.'},
                            status=status.HTTP_403_FORBIDDEN
                        )
                except Confession.DoesNotExist:
                    return Response(
                        {'error': 'Confession not found.'},
                        status=status.HTTP_404_NOT_FOUND
                    )

        # Find or create conversation
        conversation = Conversation.objects.filter(
            participants=request.user
        ).filter(
            participants__id=target_user_id
        ).filter(confession_id=confession_id).first()

        if not conversation:
            # Create new conversation
            conversation = Conversation.objects.create(
                confession_id=confession_id
            )
            conversation.participants.add(request.user, target_user_id)

        return Response(
            ConversationSerializer(conversation, context={'request': request}).data
        )


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing messages.
    """
    permission_classes = [IsAuthenticated, IsConversationParticipant]
    serializer_class = MessageSerializer

    def get_queryset(self):
        """Get messages in conversations where user is a participant"""
        conversation_id = self.request.query_params.get('conversation')

        queryset = Message.objects.filter(
            conversation__participants=self.request.user
        ).select_related(
            'sender',
            'conversation',
            'reply_to'
        ).prefetch_related(
            'attachments',
            'message_reads'
        )

        if conversation_id:
            queryset = queryset.filter(conversation_id=conversation_id)

        # Don't show deleted messages to users (except sender for a short time)
        queryset = queryset.filter(
            Q(is_deleted=False) | Q(sender=self.request.user)
        )

        return queryset.order_by('created_at')

    def perform_create(self, serializer):
        """Create a new message"""
        conversation = serializer.validated_data.get('conversation')

        # Verify user is participant
        if not conversation.participants.filter(id=self.request.user.id).exists():
            raise PermissionError('You are not a participant in this conversation')

        serializer.save(sender=self.request.user)

    def update(self, request, *args, **kwargs):
        """Update a message (edit content or pin/unpin)"""
        message = self.get_object()

        # Check if user is sender for content edits
        if 'content' in request.data:
            if message.sender != request.user:
                return Response(
                    {'error': 'You can only edit your own messages.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if not message.can_edit():
                return Response(
                    {'error': 'Message can only be edited within 10 minutes.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Check if user is admin or owner for pinning
        if 'is_pinned' in request.data:
            is_owner = message.sender == request.user
            is_admin = (message.conversation.confession and
                       (message.conversation.confession.admin == request.user or request.user.role == 'superadmin'))

            if not is_owner and not is_admin:
                return Response(
                    {'error': 'You can only pin your own messages or admin can pin any message.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Soft delete a message"""
        message = self.get_object()

        if message.sender != request.user:
            return Response(
                {'error': 'You can only delete your own messages.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Soft delete
        message.is_deleted = True
        message.save(update_fields=['is_deleted'])

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a specific message as read"""
        message = self.get_object()

        # Get or create MessageRead for this user
        message_read, created = MessageRead.objects.get_or_create(
            message=message,
            user=request.user
        )

        if not message_read.read_at:
            message_read.mark_as_read()

        return Response({'status': 'Message marked as read'})

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Pin a message - user can pin their own messages, or admin can pin any message in their confession"""
        message = self.get_object()

        # Check permissions: owner can always pin, or confession admin can pin
        is_owner = message.sender == request.user
        is_admin = (message.conversation.confession and
                   (message.conversation.confession.admin == request.user or request.user.role == 'superadmin'))

        if not is_owner and not is_admin:
            return Response(
                {'error': 'You can only pin your own messages or admin can pin any message.'},
                status=status.HTTP_403_FORBIDDEN
            )

        message.is_pinned = True
        message.save(update_fields=['is_pinned'])

        return Response(MessageSerializer(message, context={'request': request}).data)

    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        """Unpin a message - user can unpin their own messages, or admin can unpin any message in their confession"""
        message = self.get_object()

        # Check permissions: owner can always unpin, or confession admin can unpin
        is_owner = message.sender == request.user
        is_admin = (message.conversation.confession and
                   (message.conversation.confession.admin == request.user or request.user.role == 'superadmin'))

        if not is_owner and not is_admin:
            return Response(
                {'error': 'You can only unpin your own messages or admin can unpin any message.'},
                status=status.HTTP_403_FORBIDDEN
            )

        message.is_pinned = False
        message.save(update_fields=['is_pinned'])

        return Response(MessageSerializer(message, context={'request': request}).data)
