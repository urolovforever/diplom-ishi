from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CHOICES = [
        ('user', 'User'),
        ('admin', 'Confession Admin'),
        ('superadmin', 'Super Admin'),
    ]

    LANGUAGE_CHOICES = [
        ('en', 'English'),
        ('uz', 'Uzbek'),
        ('ru', 'Russian'),
    ]

    THEME_CHOICES = [
        ('light', 'Light'),
        ('dark', 'Dark'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='user')
    bio = models.TextField(blank=True, null=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    is_active = models.BooleanField(default=True)
    preferred_language = models.CharField(max_length=5, choices=LANGUAGE_CHOICES, default='en')
    preferred_theme = models.CharField(max_length=10, choices=THEME_CHOICES, default='light')

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

    @property
    def has_admin_permissions(self):
        """Check if user has admin permissions"""
        return self.role in ['admin', 'superadmin']

    @property
    def has_superadmin_permissions(self):
        """Check if user has superadmin permissions"""
        return self.role == 'superadmin'

    class Meta:
        ordering = ['-date_joined']
        permissions = [
            ('can_manage_users', 'Can manage users'),
            ('can_manage_confessions', 'Can manage confessions'),
            ('can_view_analytics', 'Can view analytics'),
            ('can_manage_posts', 'Can manage posts'),
            ('can_moderate_comments', 'Can moderate comments'),
        ]