from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class Conversation(models.Model):
    """
    Represents a conversation between users.
    Can be one-to-one (regular user to admin) or group (admins chatting).
    """
    participants = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='conversations'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_message_at = models.DateTimeField(null=True, blank=True)

    # For one-to-one conversations with confession context
    confession = models.ForeignKey(
        'confessions.Confession',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='conversations',
        help_text='The confession context for user-admin conversations'
    )

    class Meta:
        ordering = ['-last_message_at', '-updated_at']
        indexes = [
            models.Index(fields=['-last_message_at']),
            models.Index(fields=['confession']),
        ]

    def __str__(self):
        participant_usernames = ', '.join([p.username for p in self.participants.all()[:3]])
        if self.confession:
            return f"Conversation in {self.confession.name}: {participant_usernames}"
        return f"Conversation: {participant_usernames}"

    def get_unread_count(self, user):
        """Get unread message count for a specific user"""
        return self.messages.exclude(
            message_reads__user=user,
            message_reads__read_at__isnull=False
        ).exclude(sender=user).count()

    def mark_as_read(self, user):
        """Mark all messages in conversation as read for a user"""
        unread_messages = self.messages.exclude(sender=user).exclude(
            message_reads__user=user,
            message_reads__read_at__isnull=False
        )
        for message in unread_messages:
            MessageRead.objects.update_or_create(
                message=message,
                user=user,
                defaults={'read_at': timezone.now()}
            )


class Message(models.Model):
    """
    Represents a message in a conversation.
    Supports text, file attachments, edits, pinning, and replies.
    """
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages'
    )
    content = models.TextField(blank=True, null=True)

    # Reply functionality
    reply_to = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='replies'
    )

    # Message status
    is_edited = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    edited_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['conversation', 'created_at']),
            models.Index(fields=['conversation', 'is_pinned']),
            models.Index(fields=['sender', 'created_at']),
        ]

    def __str__(self):
        content_preview = self.content[:50] if self.content else '[File]'
        return f"Message from {self.sender.username}: {content_preview}"

    def can_edit(self):
        """Check if message can still be edited (within 10 minutes)"""
        if self.is_deleted:
            return False
        time_limit = self.created_at + timedelta(minutes=10)
        return timezone.now() <= time_limit

    def mark_as_edited(self):
        """Mark message as edited"""
        self.is_edited = True
        self.edited_at = timezone.now()
        self.save(update_fields=['is_edited', 'edited_at', 'updated_at'])

    def get_status_for_user(self, user):
        """
        Get message status for a specific user.
        Returns: 'sent', 'delivered', or 'seen'
        """
        if self.sender == user:
            # For sender, check if other participants have read it
            other_participants = self.conversation.participants.exclude(id=user.id)
            all_read = all(
                MessageRead.objects.filter(
                    message=self,
                    user=participant,
                    read_at__isnull=False
                ).exists()
                for participant in other_participants
            )

            if all_read:
                return 'seen'

            # Check if at least delivered (MessageRead record exists)
            any_delivered = MessageRead.objects.filter(
                message=self,
                user__in=other_participants
            ).exists()

            if any_delivered:
                return 'delivered'

            return 'sent'

        return 'received'


class MessageRead(models.Model):
    """
    Tracks read status of messages for each user.
    """
    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='message_reads'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='message_reads'
    )
    delivered_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['message', 'user']
        indexes = [
            models.Index(fields=['message', 'user']),
            models.Index(fields=['user', 'read_at']),
        ]

    def __str__(self):
        status = 'read' if self.read_at else 'delivered'
        return f"{self.user.username} - {self.message.id} - {status}"

    def mark_as_read(self):
        """Mark message as read"""
        if not self.read_at:
            self.read_at = timezone.now()
            self.save(update_fields=['read_at'])


class MessageAttachment(models.Model):
    """
    Stores file attachments for messages.
    Supports images, videos, audio, PDFs, DOCs, and other formats.
    """
    FILE_TYPE_CHOICES = [
        ('image', 'Image'),
        ('video', 'Video'),
        ('audio', 'Audio'),
        ('document', 'Document'),
        ('other', 'Other'),
    ]

    message = models.ForeignKey(
        Message,
        on_delete=models.CASCADE,
        related_name='attachments'
    )
    file = models.FileField(upload_to='messages/attachments/%Y/%m/%d/')
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    file_name = models.CharField(max_length=255)
    file_size = models.PositiveIntegerField(help_text='File size in bytes')
    mime_type = models.CharField(max_length=100)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['uploaded_at']
        indexes = [
            models.Index(fields=['message', 'file_type']),
        ]

    def __str__(self):
        return f"{self.file_name} ({self.file_type})"

    @staticmethod
    def determine_file_type(mime_type):
        """Determine file type based on MIME type"""
        if mime_type.startswith('image/'):
            return 'image'
        elif mime_type.startswith('video/'):
            return 'video'
        elif mime_type.startswith('audio/'):
            return 'audio'
        elif mime_type in ['application/pdf', 'application/msword',
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                          'application/vnd.ms-excel',
                          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                          'application/vnd.ms-powerpoint',
                          'application/vnd.openxmlformats-officedocument.presentationml.presentation']:
            return 'document'
        else:
            return 'other'
