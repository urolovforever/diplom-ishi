from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from .models import Confession, Post, Comment, Like, Subscription
from .serializers import (
    ConfessionSerializer, PostSerializer, PostCreateSerializer,
    CommentSerializer, SubscriptionSerializer
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
            return Response({'message': 'Liked'}, status=status.HTTP_201_CREATED)
        return Response({'message': 'Already liked'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def unlike(self, request, pk=None):
        """Like ni olib tashlash"""
        post = self.get_object()
        deleted, _ = Like.objects.filter(user=request.user, post=post).delete()
        if deleted:
            return Response({'message': 'Unliked'}, status=status.HTTP_200_OK)
        return Response({'message': 'Not liked'}, status=status.HTTP_400_BAD_REQUEST)


class CommentViewSet(viewsets.ModelViewSet):
    """
    Kommentlar CRUD
    """
    queryset = Comment.objects.select_related('author', 'post')
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsCommentAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['post']

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)


class SubscriptionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Foydalanuvchi obunalari
    """
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user).select_related('confession')