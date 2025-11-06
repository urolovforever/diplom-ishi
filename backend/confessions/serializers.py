from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Confession, Post, Like, Comment, Subscription, Notification

User = get_user_model()


class UserMinimalSerializer(serializers.ModelSerializer):
    """Minimal user info for nested serialization"""

    class Meta:
        model = User
        fields = ['id', 'username', 'avatar']


class ConfessionSerializer(serializers.ModelSerializer):
    admin = UserMinimalSerializer(read_only=True)
    subscribers_count = serializers.SerializerMethodField()
    posts_count = serializers.SerializerMethodField()
    is_subscribed = serializers.SerializerMethodField()

    class Meta:
        model = Confession
        fields = [
            'id', 'name', 'slug', 'description', 'logo',
            'admin', 'subscribers_count', 'posts_count',
            'is_subscribed', 'created_at'
        ]

    def get_subscribers_count(self, obj):
        return obj.subscribers.count()

    def get_posts_count(self, obj):
        return obj.posts.count()

    def get_is_subscribed(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Subscription.objects.filter(user=request.user, confession=obj).exists()
        return False


class CommentSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'author', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']


class PostSerializer(serializers.ModelSerializer):
    author = UserMinimalSerializer(read_only=True)
    confession = ConfessionSerializer(read_only=True)
    likes_count = serializers.ReadOnlyField()
    comments_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    comments = CommentSerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            'id', 'confession', 'author', 'title', 'content',
            'image', 'video_url', 'is_pinned', 'views_count', 'likes_count',
            'comments_count', 'is_liked', 'comments',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'author', 'views_count', 'created_at', 'updated_at']

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return Like.objects.filter(user=request.user, post=obj).exists()
        return False


class PostCreateSerializer(serializers.ModelSerializer):
    """Post yaratish uchun alohida serializer"""

    class Meta:
        model = Post
        fields = ['confession', 'title', 'content', 'image', 'video_url', 'is_pinned']

    def validate_confession(self, value):
        """Faqat o'z konfessiyasiga post qo'shish mumkin"""
        request = self.context.get('request')
        if request.user.role == 'admin':
            if not value.admin == request.user:
                raise serializers.ValidationError("You can only post to your managed confession.")
        return value


class SubscriptionSerializer(serializers.ModelSerializer):
    confession = ConfessionSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'confession', 'subscribed_at']
        read_only_fields = ['id', 'subscribed_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Notification serializer for confession admins"""
    actor = UserMinimalSerializer(read_only=True)
    confession = serializers.SerializerMethodField()
    post = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()
    link = serializers.SerializerMethodField()
    time_ago = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            'id', 'actor', 'notification_type', 'confession', 'post',
            'message', 'link', 'is_read', 'created_at', 'time_ago'
        ]
        read_only_fields = ['id', 'created_at']

    def get_confession(self, obj):
        """Return minimal confession info"""
        return {
            'id': obj.confession.id,
            'name': obj.confession.name,
            'slug': obj.confession.slug,
        }

    def get_post(self, obj):
        """Return post info if available"""
        if obj.post:
            return {
                'id': obj.post.id,
                'title': obj.post.title,
            }
        return None

    def get_message(self, obj):
        """Generate notification message"""
        actor_username = obj.actor.username

        if obj.notification_type == 'subscribe':
            return f"@{actor_username} followed your confession."
        elif obj.notification_type == 'like':
            post_title = obj.post.title if obj.post else 'your post'
            return f"@{actor_username} liked your post '{post_title}'."
        elif obj.notification_type == 'comment':
            post_title = obj.post.title if obj.post else 'your post'
            return f"@{actor_username} commented on your post '{post_title}'."

        return f"@{actor_username} interacted with your confession."

    def get_link(self, obj):
        """Generate link to the related content"""
        if obj.notification_type == 'subscribe':
            return f"/confession/{obj.confession.slug}"
        elif obj.post:
            return f"/post/{obj.post.id}"
        return f"/confession/{obj.confession.slug}"

    def get_time_ago(self, obj):
        """Calculate human-readable time difference"""
        from django.utils.timesince import timesince
        return timesince(obj.created_at) + " ago"