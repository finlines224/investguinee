from django.conf import settings
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator
from django.db import models
from django.db.models import F, Q


class SubscriptionRecord(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Actif"
        EXPIRED = "EXPIRED", "Expiré"
        CANCELLED = "CANCELLED", "Résilié"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="subscription_records",
    )
    plan_name = models.CharField(max_length=120)
    status = models.CharField(max_length=10, choices=Status.choices)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(
        max_length=3,
        validators=[RegexValidator(r"^[A-Z]{3}$", "Utilisez un code devise ISO à 3 lettres.")],
    )
    started_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-started_at", "-pk"]
        indexes = [
            models.Index(
                fields=["user", "status", "-started_at"],
                name="sub_user_status_start_idx",
            ),
        ]
        constraints = [
            models.CheckConstraint(
                condition=Q(amount_paid__gte=0),
                name="sub_amount_nonnegative",
            ),
            models.CheckConstraint(
                condition=Q(expires_at__isnull=True) | Q(expires_at__gte=F("started_at")),
                name="sub_expiry_after_start",
            ),
        ]

    def clean(self):
        super().clean()
        if self.user_id and self.user.role != "INVESTOR":
            raise ValidationError({"user": "Un abonnement ne peut être rattaché qu’à un investisseur."})

    def __str__(self):
        return f"{self.plan_name} · {self.user.email}"
