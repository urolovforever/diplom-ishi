from django.contrib import admin
from .models import Conversation, Message, MessageRead, MessageAttachment


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_participants', 'confession', 'last_message_at', 'created_at']
    list_filter = ['created_at', 'confession']
    search_fields = ['participants__username', 'confession__name']
    raw_id_fields = ['confession']
    filter_horizontal = ['participants']

    def get_participants(self, obj):
        return ', '.join([p.username for p in obj.participants.all()[:5]])
    get_participants.short_description = 'Participants'


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'sender', 'conversation', 'content_preview', 'is_pinned', 'is_edited', 'is_deleted', 'created_at']
    list_filter = ['is_pinned', 'is_edited', 'is_deleted', 'created_at']
    search_fields = ['content', 'sender__username']
    raw_id_fields = ['conversation', 'sender', 'reply_to']
    readonly_fields = ['created_at', 'updated_at', 'edited_at']

    def content_preview(self, obj):
        if obj.content:
            return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
        return '[No content]'
    content_preview.short_description = 'Content'


@admin.register(MessageRead)
class MessageReadAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'user', 'delivered_at', 'read_at']
    list_filter = ['delivered_at', 'read_at']
    search_fields = ['user__username', 'message__content']
    raw_id_fields = ['message', 'user']
    readonly_fields = ['delivered_at']


@admin.register(MessageAttachment)
class MessageAttachmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'message', 'file_name', 'file_type', 'file_size', 'uploaded_at']
    list_filter = ['file_type', 'uploaded_at']
    search_fields = ['file_name', 'message__content']
    raw_id_fields = ['message']
    readonly_fields = ['uploaded_at']
