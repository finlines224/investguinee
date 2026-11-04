from django.conf import settings
from django.db import models


class NotificationBroadcast(models.Model):
    title = models.CharField(max_length=160)
    body = models.TextField(max_length=2000)
    target_url = models.CharField(max_length=300, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="notification_broadcasts",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-pk"]

    def __str__(self):
        return self.title


class Notification(models.Model):
    class Kind(models.TextChoices):
        MESSAGE = "MESSAGE", "Nouveau message"
        APPOINTMENT = "APPOINTMENT", "Rendez-vous"
        ACCESS_REQUEST = "ACCESS_REQUEST", "Demande d’accès"
        ANNOUNCEMENT = "ANNOUNCEMENT", "Annonce"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    kind = models.CharField(max_length=20, choices=Kind.choices)
    title = models.CharField(max_length=160)
    body = models.TextField(max_length=2000)
    target_url = models.CharField(max_length=300, blank=True)
    broadcast = models.ForeignKey(
        NotificationBroadcast,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-pk"]
        indexes = [
            models.Index(
                fields=["recipient", "read_at", "-created_at"],
                name="notification_inbox_idx",
            ),
            models.Index(
                fields=["recipient", "kind", "-created_at"],
                name="notification_kind_idx",
            ),
        ]

    def __str__(self):
        return f"{self.title} · {self.recipient}"
