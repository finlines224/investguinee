from django.conf import settings
from django.db import models


class Conversation(models.Model):
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="investor_conversations",
    )
    entrepreneur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="entrepreneur_conversations",
    )
    project = models.ForeignKey(
        "projects.EntrepreneurProject",
        on_delete=models.PROTECT,
        related_name="conversations",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-pk"]
        constraints = [
            models.UniqueConstraint(
                fields=["investor", "entrepreneur", "project"],
                name="unique_project_conversation",
            ),
        ]
        indexes = [
            models.Index(
                fields=["investor", "-updated_at"],
                name="conv_investor_updated_idx",
            ),
            models.Index(
                fields=["entrepreneur", "-updated_at"],
                name="conv_entre_updated_idx",
            ),
        ]

    def __str__(self):
        return f"{self.project.title} · {self.investor} · {self.entrepreneur}"


class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages",
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_messages",
    )
    body = models.TextField(max_length=4000)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["created_at", "pk"]
        indexes = [
            models.Index(
                fields=["conversation", "created_at"],
                name="message_conversation_time_idx",
            ),
            models.Index(
                fields=["conversation", "sender", "read_at"],
                name="message_unread_idx",
            ),
        ]

    def __str__(self):
        return f"Message {self.pk} · conversation {self.conversation_id}"
