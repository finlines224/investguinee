from django.conf import settings
from django.db import models
from django.db.models import Q


class ProjectAccessRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        APPROVED = "APPROVED", "Approuvée"
        REJECTED = "REJECTED", "Refusée"

    project = models.ForeignKey(
        "projects.EntrepreneurProject",
        on_delete=models.CASCADE,
        related_name="access_requests",
    )
    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="project_access_requests",
    )
    justification = models.TextField(max_length=2000)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    reviewer_note = models.TextField(blank=True, max_length=2000)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_project_access_requests",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    decided_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at", "-pk"]
        indexes = [
            models.Index(
                fields=["status", "created_at"],
                name="access_req_status_created_idx",
            ),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "investor"],
                condition=Q(status__in=["PENDING", "APPROVED"]),
                name="unique_active_project_access_request",
            ),
        ]
