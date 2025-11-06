from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Confession(models.Model):
    """Diniy konfessiya (kanal)"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    logo = models.ImageField(upload_to='confessions/', blank=True, null=True)
    admin = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='managed_confessions',
        limit_choices_to={'role__in': ['admin', 'superadmin']}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        ordering = ['name']
        verbose_name = 'Confession'
        verbose_name_plural = 'Confessions'


class Subscription(models.Model):
    """Foydalanuvchi obunasi"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    confession = models.ForeignKey(Confession, on_delete=models.CASCADE, related_name='subscribers')
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'confession']
        ordering = ['-subscribed_at']

    def __str__(self):
        return f"{self.user.username} -> {self.confession.name}"


class Post(models.Model):
    """Konfessiya posti (yangilik)"""
    confession = models.ForeignKey(Confession, on_delete=models.CASCADE, related_name='posts')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='posts')
    title = models.CharField(max_length=255)
    content = models.TextField()
    image = models.ImageField(upload_to='posts/images/', blank=True, null=True)
    video_url = models.URLField(blank=True, null=True, help_text="YouTube/Vimeo URL")
    is_pinned = models.BooleanField(default=False, help_text="Pin this post to top")
    views_count = models.PositiveIntegerField(default=0, help_text="Number of views")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.confession.name}: {self.title}"

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.count()

    def increment_views(self):
        """Increment view count"""
        self.views_count += 1
        self.save(update_fields=['views_count'])

    class Meta:
        ordering = ['-is_pinned', '-created_at']
        verbose_name = 'Post'
        verbose_name_plural = 'Posts'


class Like(models.Model):
    """Post uchun like"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='likes')
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'post']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked {self.post.title}"


class Comment(models.Model):
    """Post uchun komment"""
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments')
    content = models.TextField()
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='replies',
        blank=True,
        null=True,
        help_text="Parent comment if this is a reply"
    )
    is_pinned = models.BooleanField(
        default=False,
        help_text="Pinned by confession admin"
    )
    is_edited = models.BooleanField(
        default=False,
        help_text="Comment has been edited"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.author.username} on {self.post.title}"

    @property
    def likes_count(self):
        return self.comment_likes.count()

    @property
    def replies_count(self):
        return self.replies.count()

    class Meta:
        ordering = ['-is_pinned', '-created_at']
        verbose_name = 'Comment'
        verbose_name_plural = 'Comments'


class CommentLike(models.Model):
    """Like for comments"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comment_likes')
    comment = models.ForeignKey(Comment, on_delete=models.CASCADE, related_name='comment_likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'comment']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username} liked comment by {self.comment.author.username}"


class Notification(models.Model):
    """Notification system for confession admins"""
    NOTIFICATION_TYPES = (
        ('subscribe', 'Subscribe'),
        ('like', 'Like'),
        ('comment', 'Comment'),
    )

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications_received',
        help_text="Admin who receives this notification"
    )
    actor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications_sent',
        help_text="User who triggered the notification"
    )
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    confession = models.ForeignKey(
        Confession,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='notifications',
        blank=True,
        null=True,
        help_text="Related post (for like/comment notifications)"
    )
    comment = models.ForeignKey(
        Comment,
        on_delete=models.CASCADE,
        related_name='notifications',
        blank=True,
        null=True,
        help_text="Related comment (for comment notifications)"
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.actor.username} {self.notification_type} on {self.confession.name}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
        indexes = [
            models.Index(fields=['recipient', '-created_at']),
            models.Index(fields=['recipient', 'is_read']),
        ]