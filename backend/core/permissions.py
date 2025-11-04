from rest_framework import permissions


class IsSuperAdmin(permissions.BasePermission):
    """
    Faqat SuperAdmin uchun ruxsat
    """

    def has_permission(self, request, view):
        return (
                request.user and
                request.user.is_authenticated and
                request.user.role == 'superadmin'
        )


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Obyekt egasi yoki faqat o'qish
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        return obj.author == request.user or request.user.role == 'superadmin'