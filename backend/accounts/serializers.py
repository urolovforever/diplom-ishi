from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    managed_confessions = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'bio', 'avatar',
                  'is_active', 'date_joined', 'managed_confessions', 'permissions', 'preferred_language', 'preferred_theme']
        read_only_fields = ['id', 'username', 'email', 'role', 'date_joined', 'managed_confessions', 'permissions']

    def get_managed_confessions(self, obj):
        """Return list of confessions where this user is admin"""
        from confessions.models import Confession
        confessions = Confession.objects.filter(admin=obj).values('id', 'name', 'slug')
        return list(confessions)

    def get_permissions(self, obj):
        """Return user permissions"""
        return {
            'can_manage_users': obj.has_perm('accounts.can_manage_users'),
            'can_manage_confessions': obj.has_perm('accounts.can_manage_confessions'),
            'can_view_analytics': obj.has_perm('accounts.can_view_analytics'),
            'can_manage_posts': obj.has_perm('accounts.can_manage_posts'),
            'can_moderate_comments': obj.has_perm('accounts.can_moderate_comments'),
        }


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    code = serializers.CharField(required=True, max_length=6)
    new_password = serializers.CharField(required=True, validators=[validate_password])
    confirm_password = serializers.CharField(required=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Password fields didn't match."})
        return attrs