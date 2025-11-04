from rest_framework import permissions


class IsConfessionAdminOrReadOnly(permissions.BasePermission):
    """
    Faqat konfessiya admini post yaratishi/tahrirlashi mumkin
    """

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # SuperAdmin hamma narsani qila oladi
        if request.user.role == 'superadmin':
            return True

        # Admin faqat o'z konfessiyasiga tegishli postlarni boshqaradi
        if hasattr(obj, 'confession'):
            return obj.confession.admin == request.user

        return False


class IsCommentAuthorOrReadOnly(permissions.BasePermission):
    """
    Faqat komment muallifi yoki konfessiya admini kommentni o'chirishi mumkin
    """

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True

        # Komment muallifi
        if obj.author == request.user:
            return True

        # Konfessiya admini
        if obj.post.confession.admin == request.user:
            return True

        # SuperAdmin
        if request.user.role == 'superadmin':
            return True

        return False


class IsSuperAdminOnly(permissions.BasePermission):
    """
    Faqat SuperAdmin
    """

    def has_permission(self, request, view):
        return request.user and request.user.role == 'superadmin'