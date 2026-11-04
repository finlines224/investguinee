from django.conf import settings
from django.db import models


class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "En attente"
        CONFIRMED = "CONFIRMED", "Confirmé"
        DECLINED = "DECLINED", "Refusé"
        CANCELLED = "CANCELLED", "Annulé"

    investor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="investor_appointments",
    )
    entrepreneur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="entrepreneur_appointments",
    )
    project = models.ForeignKey(
        "projects.EntrepreneurProject",
        on_delete=models.PROTECT,
        related_name="appointments",
    )
    scheduled_at = models.DateTimeField()
    message = models.TextField(max_length=2000)
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
    )
    response_note = models.TextField(blank=True, max_length=2000)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    responded_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["scheduled_at", "-pk"]
        indexes = [
            models.Index(
                fields=["entrepreneur", "status", "scheduled_at"],
                name="appointment_host_status_idx",
            ),
            models.Index(
                fields=["investor", "status", "scheduled_at"],
                name="appt_inv_status_time_idx",
            ),
            models.Index(
                fields=["status", "scheduled_at"],
                name="appointment_status_time_idx",
            ),
        ]

    def __str__(self):
        return f"{self.project.title} · {self.scheduled_at:%Y-%m-%d %H:%M}"
