from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message, MessageRead, MessageAttachment
from accounts.serializers import UserSerializer

User = get_user_model()


class MessageAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for message attachments"""

    class Meta:
        model = MessageAttachment
        fields = ['id', 'file', 'file_type', 'file_name', 'file_size', 'mime_type', 'uploaded_at']
        read_only_fields = ['id', 'file_type', 'file_name', 'file_size', 'mime_type', 'uploaded_at']

    def create(self, validated_data):
        # Auto-detect file type, name, size, and mime type
        file_obj = validated_data.get('file')
        if file_obj:
            validated_data['file_name'] = file_obj.name
            validated_data['file_size'] = file_obj.size
            validated_data['mime_type'] = file_obj.content_type or 'application/octet-stream'
            validated_data['file_type'] = MessageAttachment.determine_file_type(validated_data['mime_type'])

        return super().create(validated_data)


class MessageReadSerializer(serializers.ModelSerializer):
    """Serializer for message read status"""
    user = UserSerializer(read_only=True)

    class Meta:
        model = MessageRead
        fields = ['id', 'user', 'delivered_at', 'read_at']
        read_only_fields = ['id', 'delivered_at', 'read_at']


class ReplyToMessageSerializer(serializers.ModelSerializer):
    """Simplified serializer for reply_to messages (to avoid deep nesting)"""
    sender = UserSerializer(read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'content', 'attachments', 'created_at', 'is_deleted']
        read_only_fields = ['id', 'sender', 'created_at', 'is_deleted']


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages"""
    sender = UserSerializer(read_only=True)
    attachments = MessageAttachmentSerializer(many=True, read_only=True)
    message_reads = MessageReadSerializer(many=True, read_only=True)
    reply_to = ReplyToMessageSerializer(read_only=True)
    status = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    attachment_files = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'content', 'reply_to',
            'is_edited', 'is_pinned', 'is_deleted', 'created_at',
            'updated_at', 'edited_at', 'attachments', 'message_reads',
            'status', 'can_edit', 'attachment_files'
        ]
        read_only_fields = [
            'id', 'sender', 'is_edited', 'edited_at', 'created_at',
            'updated_at', 'message_reads', 'status', 'can_edit'
        ]

    def get_status(self, obj):
        """Get message status for the requesting user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_status_for_user(request.user)
        return 'sent'

    def get_can_edit(self, obj):
        """Check if message can be edited"""
        return obj.can_edit()

    def create(self, validated_data):
        # Extract attachment files from validated data
        attachment_files = validated_data.pop('attachment_files', [])

        # Set sender from request
        request = self.context.get('request')
        validated_data['sender'] = request.user

        # Create message
        message = super().create(validated_data)

        # Create attachments
        for file_obj in attachment_files:
            MessageAttachment.objects.create(
                message=message,
                file=file_obj,
                file_name=file_obj.name,
                file_size=file_obj.size,
                mime_type=file_obj.content_type or 'application/octet-stream',
                file_type=MessageAttachment.determine_file_type(
                    file_obj.content_type or 'application/octet-stream'
                )
            )

        # Create MessageRead records for other participants
        conversation = message.conversation
        other_participants = conversation.participants.exclude(id=request.user.id)
        for participant in other_participants:
            MessageRead.objects.create(message=message, user=participant)

        # Update conversation's last_message_at
        from django.utils import timezone
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])

        return message

    def update(self, instance, validated_data):
        # Remove fields that shouldn't be updated
        validated_data.pop('conversation', None)
        validated_data.pop('sender', None)
        validated_data.pop('attachment_files', None)

        # Only allow content updates if message can be edited
        if 'content' in validated_data:
            if not instance.can_edit():
                raise serializers.ValidationError("Message can only be edited within 10 minutes of creation")
            instance.content = validated_data['content']
            instance.mark_as_edited()

        # Allow pinning/unpinning
        if 'is_pinned' in validated_data:
            instance.is_pinned = validated_data['is_pinned']

        instance.save()
        return instance


class ConversationSerializer(serializers.ModelSerializer):
    """Serializer for conversations"""
    participants = UserSerializer(many=True, read_only=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    participant_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'participant_ids', 'confession',
            'created_at', 'updated_at', 'last_message_at',
            'last_message', 'unread_count'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'last_message_at']

    def get_last_message(self, obj):
        """Get the last message in the conversation"""
        last_message = obj.messages.filter(is_deleted=False).last()
        if last_message:
            return MessageSerializer(last_message, context=self.context).data
        return None

    def get_unread_count(self, obj):
        """Get unread message count for the requesting user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0

    def create(self, validated_data):
        participant_ids = validated_data.pop('participant_ids', [])
        request = self.context.get('request')

        # Create conversation
        conversation = Conversation.objects.create(**validated_data)

        # Add requesting user as a participant
        conversation.participants.add(request.user)

        # Add other participants
        if participant_ids:
            participants = User.objects.filter(id__in=participant_ids)
            conversation.participants.add(*participants)

        return conversation


class ConversationListSerializer(serializers.ModelSerializer):
    """Simplified serializer for conversation list"""
    participants = UserSerializer(many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()
    last_message_preview = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants', 'confession', 'last_message_at',
            'unread_count', 'last_message_preview'
        ]

    def get_unread_count(self, obj):
        """Get unread message count for the requesting user"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.get_unread_count(request.user)
        return 0

    def get_last_message_preview(self, obj):
        """Get a preview of the last message"""
        last_message = obj.messages.filter(is_deleted=False).last()
        if last_message:
            content = last_message.content if last_message.content else '[Attachment]'
            return {
                'id': last_message.id,
                'sender': last_message.sender.username,
                'content': content[:50] + '...' if len(content) > 50 else content,
                'created_at': last_message.created_at
            }
        return None
