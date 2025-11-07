from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView,
    UserProfileView,
    PublicUserProfileView,
    ChangePasswordView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    AdminUsersListView
)
from .admin_views import (
    AdminDashboardView,
    AdminUserManagementViewSet,
    AdminConfessionManagementView,
    AdminSystemStatsView,
)

# Router for admin viewsets
router = DefaultRouter()
router.register(r'admin/users', AdminUserManagementViewSet, basename='admin-users-manage')

urlpatterns = [
    # Authentication
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # User Profile
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('users/<str:username>/', PublicUserProfileView.as_view(), name='public_profile'),

    # Password Management
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),

    # Legacy admin endpoint (keep for backwards compatibility)
    path('admin-users/', AdminUsersListView.as_view(), name='admin_users'),

    # Admin Panel Endpoints
    path('admin/dashboard/', AdminDashboardView.as_view(), name='admin-dashboard'),
    path('admin/confessions/', AdminConfessionManagementView.as_view(), name='admin-confessions'),
    path('admin/system-stats/', AdminSystemStatsView.as_view(), name='admin-system-stats'),

    # Include router URLs
    path('', include(router.urls)),
]