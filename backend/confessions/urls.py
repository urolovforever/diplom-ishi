from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConfessionViewSet, PostViewSet, CommentViewSet, SubscriptionViewSet

router = DefaultRouter()
router.register('confessions', ConfessionViewSet, basename='confession')
router.register('posts', PostViewSet, basename='post')
router.register('comments', CommentViewSet, basename='comment')
router.register('subscriptions', SubscriptionViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]