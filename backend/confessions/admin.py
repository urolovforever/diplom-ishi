from django.contrib import admin
from django.utils.html import format_html
from .models import Confession, Post, PostMedia, Comment, Like, Subscription, Notification, PostView


@admin.register(Confession)
class ConfessionAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'admin', 'subscribers_count', 'posts_count', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'description', 'logo')
        }),
        ('Management', {
            'fields': ('admin',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def subscribers_count(self, obj):
        count = obj.subscribers.count()
        return format_html('<strong>{}</strong>', count)

    subscribers_count.short_description = 'Subscribers'

    def posts_count(self, obj):
        count = obj.posts.count()
        return format_html('<strong>{}</strong>', count)

    posts_count.short_description = 'Posts'


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['title', 'confession', 'author', 'is_pinned', 'comments_enabled', 'likes_count', 'comments_count', 'created_at']
    list_filter = ['confession', 'is_pinned', 'comments_enabled', 'created_at']
    search_fields = ['title', 'content']
    readonly_fields = ['created_at', 'updated_at', 'likes_count', 'comments_count']
    list_editable = ['is_pinned', 'comments_enabled']

    fieldsets = (
        ('Content', {
            'fields': ('confession', 'author', 'title', 'content')
        }),
        ('Media', {
            'fields': ('image', 'video_url')
        }),
        ('Settings', {
            'fields': ('is_pinned', 'comments_enabled')
        }),
        ('Statistics', {
            'fields': ('likes_count', 'comments_count', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def likes_count(self, obj):
        return obj.likes.count()

    likes_count.short_description = 'Likes'

    def comments_count(self, obj):
        return obj.comments.count()

    comments_count.short_description = 'Comments'


@admin.register(PostMedia)
class PostMediaAdmin(admin.ModelAdmin):
    list_display = ['post', 'media_type', 'order', 'file_size_display', 'uploaded_at']
    list_filter = ['media_type', 'uploaded_at']
    search_fields = ['post__title']
    readonly_fields = ['uploaded_at', 'file_size', 'width', 'height', 'duration']
    list_editable = ['order']

    fieldsets = (
        ('Post', {
            'fields': ('post', 'media_type', 'file', 'order')
        }),
        ('Metadata', {
            'fields': ('thumbnail', 'width', 'height', 'duration', 'file_size', 'uploaded_at'),
            'classes': ('collapse',)
        }),
    )

    def file_size_display(self, obj):
        if obj.file_size:
            # Convert bytes to KB/MB
            if obj.file_size < 1024 * 1024:  # < 1MB
                return f"{obj.file_size / 1024:.1f} KB"
            else:
                return f"{obj.file_size / (1024 * 1024):.1f} MB"
        return "-"

    file_size_display.short_description = 'Size'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['author', 'post', 'content_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['content', 'author__username', 'post__title']
    readonly_fields = ['created_at', 'updated_at']

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content

    content_preview.short_description = 'Content'


@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ['user', 'post', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'post__title']
    readonly_fields = ['created_at']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'confession', 'subscribed_at']
    list_filter = ['confession', 'subscribed_at']
    search_fields = ['user__username', 'confession__name']
    readonly_fields = ['subscribed_at']


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['recipient', 'actor', 'notification_type', 'confession', 'is_read', 'created_at']
    list_filter = ['notification_type', 'is_read', 'created_at']
    search_fields = ['recipient__username', 'actor__username', 'confession__name']
    readonly_fields = ['created_at']
    list_editable = ['is_read']

    fieldsets = (
        ('Recipients & Actors', {
            'fields': ('recipient', 'actor')
        }),
        ('Notification Details', {
            'fields': ('notification_type', 'confession', 'post', 'comment')
        }),
        ('Status', {
            'fields': ('is_read', 'created_at')
        }),
    )


@admin.register(PostView)
class PostViewAdmin(admin.ModelAdmin):
    list_display = ['post', 'user', 'ip_address', 'viewed_at']
    list_filter = ['viewed_at']
    search_fields = ['post__title', 'user__username', 'ip_address']
    readonly_fields = ['post', 'user', 'ip_address', 'viewed_at']
    date_hierarchy = 'viewed_at'

    def has_add_permission(self, request):
        # Prevent manual creation of views in admin
        return False