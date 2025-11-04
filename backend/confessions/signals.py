from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.contrib.auth import get_user_model
from .models import Post, Confession

User = get_user_model()

@receiver(post_save, sender=Post)
def notify_subscribers(sender, instance, created, **kwargs):
    """
    Yangi post joylanganda obunachilarga bildirishnoma (keyinchalik)
    """
    if created:
        # Bu yerda bildirishnoma yuborish logikasi bo'lishi mumkin
        print(f"New post created: {instance.title} in {instance.confession.name}")


@receiver(pre_delete, sender=Confession)
def prevent_confession_deletion_if_has_posts(sender, instance, **kwargs):
    """
    Agar konfessiyada postlar bo'lsa, o'chirmaslik (ixtiyoriy)
    """
    if instance.posts.exists():
        raise ValueError(f"Cannot delete {instance.name} - it has posts!")