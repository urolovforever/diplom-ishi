from rest_framework import permissions


class IsConversationParticipant(permissions.BasePermission):
    """
    Permission to check if user is a participant in the conversation.
    """
    def has_object_permission(self, request, view, obj):
        # For conversation objects
        if hasattr(obj, 'participants'):
            return obj.participants.filter(id=request.user.id).exists()
        # For message objects
        elif hasattr(obj, 'conversation'):
            return obj.conversation.participants.filter(id=request.user.id).exists()
        return False


class IsMessageSender(permissions.BasePermission):
    """
    Permission to check if user is the sender of the message.
    Used for editing and deleting messages.
    """
    def has_object_permission(self, request, view, obj):
        return obj.sender == request.user


class CanMessageUser(permissions.BasePermission):
    """
    Permission to check if a user can message another user.
    Rules:
    - Regular users can only message admins of confessions they follow
    - Admins can message other admins freely
    - Admins can reply to regular users who message them
    """
    message = 'You can only message admins of confessions you follow.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False

        # Admins and superadmins can message anyone
        if request.user.role in ['admin', 'superadmin']:
            return True

        # For regular users, they can only initiate conversations with admins
        # This will be further validated in the view
        return True

    def has_object_permission(self, request, view, obj):
        # Users can access conversations they're part of
        if hasattr(obj, 'participants'):
            return obj.participants.filter(id=request.user.id).exists()

        return True
