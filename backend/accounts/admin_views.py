from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from core.permissions import IsSuperAdmin
from .serializers import UserSerializer
from confessions.models import Confession, Post, Subscription, Comment, Like
from messaging.models import Conversation, Message

User = get_user_model()


class AdminDashboardView(APIView):
    """
    Admin Dashboard Analytics
    Provides overview statistics for super admins
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        # User statistics
        total_users = User.objects.count()
        total_admins = User.objects.filter(role__in=['admin', 'superadmin']).count()
        total_regular_users = User.objects.filter(role='user').count()

        # Users registered in the last 30 days
        thirty_days_ago = timezone.now() - timedelta(days=30)
        new_users_30d = User.objects.filter(date_joined__gte=thirty_days_ago).count()

        # Confession statistics
        total_confessions = Confession.objects.count()
        confessions_without_admin = Confession.objects.filter(admin__isnull=True).count()

        # Post statistics
        total_posts = Post.objects.count()
        posts_30d = Post.objects.filter(created_at__gte=thirty_days_ago).count()

        # Subscription statistics
        total_subscriptions = Subscription.objects.count()
        subscriptions_30d = Subscription.objects.filter(subscribed_at__gte=thirty_days_ago).count()

        # Engagement statistics
        total_comments = Comment.objects.count()
        total_likes = Like.objects.count()
        comments_30d = Comment.objects.filter(created_at__gte=thirty_days_ago).count()
        likes_30d = Like.objects.filter(created_at__gte=thirty_days_ago).count()

        # Messaging statistics
        total_conversations = Conversation.objects.count()
        total_messages = Message.objects.count()
        messages_30d = Message.objects.filter(created_at__gte=thirty_days_ago).count()

        # Top confessions by subscribers
        top_confessions = Confession.objects.annotate(
            subscriber_count=Count('subscribers')
        ).order_by('-subscriber_count')[:5].values('id', 'name', 'subscriber_count')

        # Top posts by views
        top_posts = Post.objects.order_by('-views_count')[:5].values(
            'id', 'title', 'views_count', 'confession__name'
        )

        # Recent users
        recent_users = User.objects.order_by('-date_joined')[:10].values(
            'id', 'username', 'email', 'role', 'date_joined'
        )

        return Response({
            'users': {
                'total': total_users,
                'admins': total_admins,
                'regular_users': total_regular_users,
                'new_last_30_days': new_users_30d,
            },
            'confessions': {
                'total': total_confessions,
                'without_admin': confessions_without_admin,
            },
            'posts': {
                'total': total_posts,
                'new_last_30_days': posts_30d,
            },
            'subscriptions': {
                'total': total_subscriptions,
                'new_last_30_days': subscriptions_30d,
            },
            'engagement': {
                'total_comments': total_comments,
                'total_likes': total_likes,
                'comments_last_30_days': comments_30d,
                'likes_last_30_days': likes_30d,
            },
            'messaging': {
                'total_conversations': total_conversations,
                'total_messages': total_messages,
                'messages_last_30_days': messages_30d,
            },
            'top_confessions': list(top_confessions),
            'top_posts': list(top_posts),
            'recent_users': list(recent_users),
        })


class AdminUserManagementViewSet(viewsets.ModelViewSet):
    """
    Admin User Management
    Full CRUD operations for users (super admin only)
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]
    queryset = User.objects.all()

    def get_queryset(self):
        queryset = User.objects.all().order_by('-date_joined')

        # Filter by role
        role = self.request.query_params.get('role', None)
        if role:
            queryset = queryset.filter(role=role)

        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')

        # Search by username or email
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(username__icontains=search) |
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )

        return queryset

    @action(detail=True, methods=['post'])
    def change_role(self, request, pk=None):
        """Change user role"""
        user = self.get_object()
        new_role = request.data.get('role')

        if new_role not in ['user', 'admin', 'superadmin']:
            return Response(
                {'error': 'Invalid role. Must be user, admin, or superadmin'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Prevent changing own role
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot change your own role'},
                status=status.HTTP_403_FORBIDDEN
            )

        user.role = new_role
        user.save(update_fields=['role'])

        return Response({
            'message': f'User role changed to {new_role}',
            'user': UserSerializer(user).data
        })

    @action(detail=True, methods=['post'])
    def toggle_active(self, request, pk=None):
        """Activate or deactivate user"""
        user = self.get_object()

        # Prevent deactivating yourself
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot deactivate your own account'},
                status=status.HTTP_403_FORBIDDEN
            )

        user.is_active = not user.is_active
        user.save(update_fields=['is_active'])

        return Response({
            'message': f'User {"activated" if user.is_active else "deactivated"}',
            'user': UserSerializer(user).data
        })

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        """Get user activity statistics"""
        user = self.get_object()

        # Get user posts
        posts_count = Post.objects.filter(author=user).count()

        # Get user comments
        comments_count = Comment.objects.filter(author=user).count()

        # Get user likes
        likes_count = Like.objects.filter(user=user).count()

        # Get user subscriptions
        subscriptions_count = Subscription.objects.filter(user=user).count()

        # Get managed confessions
        managed_confessions = Confession.objects.filter(admin=user).values('id', 'name', 'slug')

        # Get messages sent
        messages_sent = Message.objects.filter(sender=user).count()

        return Response({
            'posts_count': posts_count,
            'comments_count': comments_count,
            'likes_count': likes_count,
            'subscriptions_count': subscriptions_count,
            'managed_confessions': list(managed_confessions),
            'messages_sent': messages_sent,
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get overall user statistics"""
        total_users = User.objects.count()
        active_users = User.objects.filter(is_active=True).count()
        inactive_users = total_users - active_users

        users_by_role = {
            'user': User.objects.filter(role='user').count(),
            'admin': User.objects.filter(role='admin').count(),
            'superadmin': User.objects.filter(role='superadmin').count(),
        }

        # Users registered per month (last 6 months)
        monthly_registrations = []
        for i in range(5, -1, -1):
            month_start = timezone.now() - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            count = User.objects.filter(
                date_joined__gte=month_start,
                date_joined__lt=month_end
            ).count()
            monthly_registrations.append({
                'month': month_start.strftime('%Y-%m'),
                'count': count
            })

        return Response({
            'total_users': total_users,
            'active_users': active_users,
            'inactive_users': inactive_users,
            'users_by_role': users_by_role,
            'monthly_registrations': monthly_registrations,
        })

    @action(detail=True, methods=['post'])
    def manage_permissions(self, request, pk=None):
        """Manage user permissions"""
        user = self.get_object()
        permissions_data = request.data.get('permissions', {})

        content_type = ContentType.objects.get_for_model(User)
        permission_codenames = {
            'can_manage_users': 'can_manage_users',
            'can_manage_confessions': 'can_manage_confessions',
            'can_view_analytics': 'can_view_analytics',
            'can_manage_posts': 'can_manage_posts',
            'can_moderate_comments': 'can_moderate_comments',
        }

        for perm_key, perm_codename in permission_codenames.items():
            if perm_key in permissions_data:
                try:
                    permission = Permission.objects.get(
                        codename=perm_codename,
                        content_type=content_type
                    )
                    if permissions_data[perm_key]:
                        user.user_permissions.add(permission)
                    else:
                        user.user_permissions.remove(permission)
                except Permission.DoesNotExist:
                    continue

        return Response({
            'message': 'Permissions updated successfully',
            'user': UserSerializer(user).data
        })

    @action(detail=False, methods=['get'])
    def available_permissions(self, request):
        """Get list of available permissions"""
        content_type = ContentType.objects.get_for_model(User)
        permissions = Permission.objects.filter(content_type=content_type).values(
            'id', 'name', 'codename'
        )
        return Response(list(permissions))


class AdminConfessionManagementView(APIView):
    """
    Admin Confession Management
    Manage confessions, assign admins, view statistics
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        """List all confessions with statistics"""
        confessions = Confession.objects.annotate(
            subscriber_count=Count('subscribers', distinct=True),
            post_count=Count('posts', distinct=True)
        ).select_related('admin').order_by('-created_at')

        confession_data = []
        for confession in confessions:
            confession_data.append({
                'id': confession.id,
                'name': confession.name,
                'slug': confession.slug,
                'description': confession.description,
                'logo': confession.logo.url if confession.logo else None,
                'admin': {
                    'id': confession.admin.id,
                    'username': confession.admin.username,
                    'email': confession.admin.email,
                } if confession.admin else None,
                'subscriber_count': confession.subscriber_count,
                'post_count': confession.post_count,
                'created_at': confession.created_at,
                'updated_at': confession.updated_at,
            })

        return Response(confession_data)

    def post(self, request):
        """Assign admin to confession"""
        confession_id = request.data.get('confession_id')
        user_id = request.data.get('user_id')

        try:
            confession = Confession.objects.get(id=confession_id)
            user = User.objects.get(id=user_id)

            # Check if user has admin role
            if user.role not in ['admin', 'superadmin']:
                return Response(
                    {'error': 'User must have admin or superadmin role'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            confession.admin = user
            confession.save(update_fields=['admin'])

            return Response({
                'message': f'{user.username} assigned as admin of {confession.name}',
                'confession': {
                    'id': confession.id,
                    'name': confession.name,
                    'admin': {
                        'id': user.id,
                        'username': user.username,
                    }
                }
            })
        except Confession.DoesNotExist:
            return Response(
                {'error': 'Confession not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except User.DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class AdminSystemStatsView(APIView):
    """
    System-wide statistics and health check
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        # Daily active users (users who posted, commented, or liked in last 24h)
        yesterday = timezone.now() - timedelta(days=1)

        active_users_24h = User.objects.filter(
            Q(posts__created_at__gte=yesterday) |
            Q(comments__created_at__gte=yesterday) |
            Q(likes__created_at__gte=yesterday)
        ).distinct().count()

        # Growth metrics
        seven_days_ago = timezone.now() - timedelta(days=7)
        thirty_days_ago = timezone.now() - timedelta(days=30)

        users_7d = User.objects.filter(date_joined__gte=seven_days_ago).count()
        users_30d = User.objects.filter(date_joined__gte=thirty_days_ago).count()

        posts_7d = Post.objects.filter(created_at__gte=seven_days_ago).count()
        posts_30d = Post.objects.filter(created_at__gte=thirty_days_ago).count()

        # Top active users (by posts + comments)
        from django.db.models import Count
        top_users = User.objects.annotate(
            total_activity=Count('posts') + Count('comments')
        ).order_by('-total_activity')[:10].values(
            'id', 'username', 'role', 'total_activity'
        )

        return Response({
            'active_users_24h': active_users_24h,
            'growth': {
                'users_7d': users_7d,
                'users_30d': users_30d,
                'posts_7d': posts_7d,
                'posts_30d': posts_30d,
            },
            'top_users': list(top_users),
        })
