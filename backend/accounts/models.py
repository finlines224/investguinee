from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models import Q
from django.conf import settings


class User(AbstractUser):
    class Role(models.TextChoices):
        INVESTOR = "INVESTOR", "Investisseur"
        ENTREPRENEUR = "ENTREPRENEUR", "Entrepreneur"
        STUDENT = "STUDENT", "Étudiant"
        ADMIN = "ADMIN", "Administrateur"

    email = models.EmailField(unique=True)

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.ENTREPRENEUR,
    )

    phone_number = models.CharField(
        max_length=30,
        blank=True,
    )

    is_verified = models.BooleanField(default=False)
    profile_data = models.JSONField(default=dict, blank=True)
    terms_accepted_at = models.DateTimeField(null=True, blank=True)
    marketing_consent = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email


class UserRole(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="role_assignments",
    )
    role = models.CharField(max_length=20, choices=User.Role.choices)
    is_primary = models.BooleanField(default=False)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_role_grants",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["user_id", "role"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "role"],
                name="unique_user_role_assignment",
            ),
            models.UniqueConstraint(
                fields=["user"],
                condition=Q(is_primary=True),
                name="one_primary_role_per_user",
            ),
        ]

    def __str__(self):
        return f"{self.user} · {self.get_role_display()}"
