from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from core.pagination import StandardResultsSetPagination
from .models import Confession, Post, Comment, Like, Subscription, Notification, CommentLike, PostView
from .serializers import (
    ConfessionSerializer, PostSerializer, PostCreateSerializer,
    CommentSerializer, CommentReplySerializer, SubscriptionSerializer, UserMinimalSerializer,
    NotificationSerializer
)
from .permissions import IsConfessionAdminOrReadOnly, IsCommentAuthorOrReadOnly, IsSuperAdminOnly, IsConfessionAdminOrSuperAdmin


class ConfessionViewSet(viewsets.ModelViewSet):
    """
    Konfessiyalar CRUD
    """
    queryset = Confession.objects.all()
    serializer_class = ConfessionSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    lookup_field = 'slug'
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    pagination_class = StandardResultsSetPagination

    def get_permissions(self):
        if self.action in ['create', 'destroy']:
            return [IsSuperAdminOnly()]
        elif self.action in ['update', 'partial_update']:
            return [IsConfessionAdminOrSuperAdmin()]
        return super().get_permissions()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def subscribe(self, request, slug=None):
        """Konfessiyaga obuna bo'lish"""
        confession = self.get_object()
        subscription, created = Subscription.objects.get_or_create(
            user=request.user,
            confession=confession
        )
        if created:
            # Create notification for confession admin
            if confession.admin and confession.admin != request.user:
                Notification.objects.create(
                    recipient=confession.admin,
                    actor=request.user,
                    notification_type='subscribe',
                    confession=confession
                )
            return Response({'message': 'Subscribed successfully'}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already subscribed'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unsubscribe(self, request, slug=None):
        """Obunani bekor qilish"""
        confession = self.get_object()
        deleted, _ = Subscription.objects.filter(
            user=request.user,
            confession=confession
        ).delete()
        if deleted:
            # Delete subscribe notification (like unlike does)
            Notification.objects.filter(
                recipient=confession.admin,
                actor=request.user,
                notification_type='subscribe',
                confession=confession
            ).delete()
            return Response({'message': 'Unsubscribed successfully'}, status=status.HTTP_200_OK)
        return Response({'message': 'Not subscribed'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], permission_classes=[IsSuperAdminOnly])
    def assign_admin(self, request, slug=None):
        """Konfessiyaga admin tayinlash (faqat super admin)"""
        confession = self.get_object()
        admin_id = request.data.get('admin_id')

        if not admin_id:
            return Response({'error': 'admin_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            admin_user = User.objects.get(id=admin_id)

            if admin_user.role not in ['admin', 'superadmin']:
                return Response({'error': 'User must have admin or superadmin role'}, status=status.HTTP_400_BAD_REQUEST)

            confession.admin = admin_user
            confession.save()

            return Response({
                'message': 'Admin assigned successfully',
                'confession': ConfessionSerializer(confession, context={'request': request}).data
            }, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['get'])
    def followers(self, request, slug=None):
        """Konfessiya obunachilari ro'yxati"""
        confession = self.get_object()
        subscriptions = Subscription.objects.filter(confession=confession).select_related('user')
        followers = [subscription.user for subscription in subscriptions]
        serializer = UserMinimalSerializer(followers, many=True)
        return Response(serializer.data)


class PostViewSet(viewsets.ModelViewSet):
    """
    Postlar CRUD
    """
    queryset = Post.objects.select_related('confession', 'author').prefetch_related('likes', 'comments')
    permission_classes = [IsConfessionAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['confession']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'likes_count']

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PostCreateSerializer
        return PostSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        """Retrieve post and increment view count (once per user per day)"""
        from datetime import timedelta
        from django.utils import timezone

        instance = self.get_object()

        # Get user identifier (user or IP address)
        user = request.user if request.user.is_authenticated else None
        ip_address = self.get_client_ip(request) if not user else None

        # Check if user/IP has viewed this post in the last 24 hours
        day_ago = timezone.now() - timedelta(days=1)

        if user:
            # Check by user
            recent_view = PostView.objects.filter(
                post=instance,
                user=user,
                viewed_at__gte=day_ago
            ).exists()
        else:
            # Check by IP address
            recent_view = PostView.objects.filter(
                post=instance,
                ip_address=ip_address,
                viewed_at__gte=day_ago
            ).exists()

        # Only increment view if user hasn't viewed recently
        if not recent_view:
            # Create new view record
            PostView.objects.create(
                post=instance,
                user=user,
                ip_address=ip_address
            )
            # Increment count
            instance.increment_views()

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def get_client_ip(self, request):
        """Get client IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def feed(self, request):
        """Foydalanuvchining obuna bo'lgan konfessiyalari postlari"""
        subscriptions = Subscription.objects.filter(user=request.user).values_list('confession', flat=True)
        posts = self.queryset.filter(confession__in=subscriptions)

        page = self.paginate_queryset(posts)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Postga like qo'shish"""
        post = self.get_object()
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if created:
            # Create notification for confession admin
            if post.confession.admin and post.confession.admin != request.user:
                Notification.objects.create(
                    recipient=post.confession.admin,
                    actor=request.user,
                    notification_type='like',
                    confession=post.confession,
                    post=post
                )
            return Response({'message': 'Liked'}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already liked'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        """Like ni olib tashlash"""
        post = self.get_object()
        deleted, _ = Like.objects.filter(user=request.user, post=post).delete()
        if deleted:
            # Delete like notification (same as unsubscribe)
            Notification.objects.filter(
                recipient=post.confession.admin,
                actor=request.user,
                notification_type='like',
                post=post
            ).delete()
            return Response({'message': 'Unliked'}, status=status.HTTP_200_OK)
        return Response({'message': 'Not liked'}, status=status.HTTP_400_BAD_REQUEST)


class CommentViewSet(viewsets.ModelViewSet):
    """
    Kommentlar CRUD with nested replies and likes
    """
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCommentAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['post', 'parent']

    def get_queryset(self):
        """Return top-level comments by default, or filtered by parent"""
        queryset = Comment.objects.select_related('author', 'post').prefetch_related('replies')

        # If filtering by post, only return top-level comments (parent=None)
        if self.request.query_params.get('post') and not self.request.query_params.get('parent'):
            queryset = queryset.filter(parent__isnull=True)

        return queryset

    def perform_create(self, serializer):
        comment = serializer.save(author=self.request.user)

        # Determine who to notify
        post = comment.post
        recipient = None
        notif_type = 'comment'

        if comment.parent:
            # If this is a reply, notify the parent comment author
            recipient = comment.parent.author
            notif_type = 'comment_reply'
        elif post.confession.admin and post.confession.admin != self.request.user:
            # If this is a top-level comment, notify the confession admin
            recipient = post.confession.admin
            notif_type = 'comment'

        # Create notification
        if recipient and recipient != self.request.user:
            Notification.objects.create(
                recipient=recipient,
                actor=self.request.user,
                notification_type=notif_type,
                confession=post.confession,
                post=post,
                comment=comment
            )

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def like(self, request, pk=None):
        """Like a comment"""
        comment = self.get_object()
        like, created = CommentLike.objects.get_or_create(user=request.user, comment=comment)

        if created:
            # Create notification for comment author (not for yourself)
            if comment.author != request.user:
                Notification.objects.create(
                    recipient=comment.author,
                    actor=request.user,
                    notification_type='comment_like',
                    confession=comment.post.confession,
                    post=comment.post,
                    comment=comment
                )
            return Response({'message': 'Comment liked'}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already liked'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        """Unlike a comment"""
        comment = self.get_object()
        deleted, _ = CommentLike.objects.filter(user=request.user, comment=comment).delete()

        if deleted:
            # Delete comment like notification
            Notification.objects.filter(
                recipient=comment.author,
                actor=request.user,
                notification_type='comment_like',
                comment=comment
            ).delete()
            return Response({'message': 'Comment unliked'}, status=status.HTTP_200_OK)
        return Response({'message': 'Not liked'}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def replies(self, request, pk=None):
        """Get all replies for a comment"""
        comment = self.get_object()
        replies = comment.replies.all()
        serializer = CommentReplySerializer(replies, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def pin(self, request, pk=None):
        """Pin a comment (confession admin only)"""
        comment = self.get_object()
        post = comment.post

        # Only confession admin can pin
        if post.confession.admin != request.user and request.user.role != 'superadmin':
            return Response({'error': 'Only confession admin can pin comments'}, status=status.HTTP_403_FORBIDDEN)

        comment.is_pinned = True
        comment.save()
        return Response({'message': 'Comment pinned'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unpin(self, request, pk=None):
        """Unpin a comment (confession admin only)"""
        comment = self.get_object()
        post = comment.post

        # Only confession admin can unpin
        if post.confession.admin != request.user and request.user.role != 'superadmin':
            return Response({'error': 'Only confession admin can unpin comments'}, status=status.HTTP_403_FORBIDDEN)

        comment.is_pinned = False
        comment.save()
        return Response({'message': 'Comment unpinned'}, status=status.HTTP_200_OK)


class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Foydalanuvchi obunalari
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user).select_related('confession')


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Notifications for all users
    """
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Show notifications for the current user"""
        user = self.request.user
        return Notification.objects.filter(recipient=user).select_related(
            'actor', 'confession', 'post', 'comment'
        )

    @action(detail=False, methods=['post'])
    def mark_all_read(self, request):
        """Mark all notifications as read"""
        updated = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).update(is_read=True)
        return Response({
            'message': f'{updated} notifications marked as read'
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """Mark a single notification as read"""
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({
            'message': 'Notification marked as read'
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications"""
        count = Notification.objects.filter(
            recipient=request.user,
            is_read=False
        ).count()
        return Response({'count': count}, status=status.HTTP_200_OK)