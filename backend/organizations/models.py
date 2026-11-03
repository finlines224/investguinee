from django.conf import settings
from django.db import models
from django.db.models import Q


class VerificationStatus(models.TextChoices):
	DRAFT = "DRAFT", "Brouillon"
	SUBMITTED = "SUBMITTED", "Soumis"
	IN_REVIEW = "IN_REVIEW", "En cours d’examen"
	MORE_INFO_REQUIRED = "MORE_INFO_REQUIRED", "Informations requises"
	APPROVED = "APPROVED", "Approuvé"
	REJECTED = "REJECTED", "Rejeté"
	EXPIRED = "EXPIRED", "Expiré"
	SUSPENDED = "SUSPENDED", "Suspendu"


class Organization(models.Model):
	legal_name = models.CharField(max_length=200)
	display_name = models.CharField(max_length=200, blank=True)
	organization_type = models.CharField(max_length=50)
	registration_number = models.CharField(max_length=100, null=True, blank=True)
	country_code = models.CharField(max_length=2, default="GN")
	region = models.CharField(max_length=120, blank=True)
	city = models.CharField(max_length=120, blank=True)
	website_url = models.URLField(max_length=500, blank=True)
	description = models.TextField(blank=True)
	verification_status = models.CharField(
		max_length=24,
		choices=VerificationStatus.choices,
		default=VerificationStatus.DRAFT,
	)
	created_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		related_name="created_organizations",
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["legal_name", "pk"]
		constraints = [
			models.UniqueConstraint(
				fields=["country_code", "registration_number"],
				condition=Q(registration_number__isnull=False),
				name="unique_org_registration_country",
			),
		]

	def __str__(self):
		return self.display_name or self.legal_name


class OrganizationMember(models.Model):
	organization = models.ForeignKey(
		Organization,
		on_delete=models.CASCADE,
		related_name="memberships",
	)
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="organization_memberships",
	)
	organization_role = models.CharField(max_length=50, default="MEMBER")
	is_primary_contact = models.BooleanField(default=False)
	joined_at = models.DateTimeField(auto_now_add=True)

	class Meta:
		ordering = ["organization_id", "joined_at"]
		constraints = [
			models.UniqueConstraint(
				fields=["organization", "user"],
				name="unique_organization_member",
			),
			models.UniqueConstraint(
				fields=["organization"],
				condition=Q(is_primary_contact=True),
				name="one_primary_org_contact",
			),
		]


class VerificationCase(models.Model):
	user = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		null=True,
		blank=True,
		related_name="verification_cases",
	)
	organization = models.ForeignKey(
		Organization,
		on_delete=models.PROTECT,
		null=True,
		blank=True,
		related_name="verification_cases",
	)
	verification_type = models.CharField(max_length=40)
	status = models.CharField(
		max_length=24,
		choices=VerificationStatus.choices,
		default=VerificationStatus.DRAFT,
	)
	submitted_at = models.DateTimeField(null=True, blank=True)
	reviewed_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="reviewed_verification_cases",
	)
	reviewer_notes = models.TextField(blank=True)
	decision_reason = models.TextField(blank=True)
	decided_at = models.DateTimeField(null=True, blank=True)
	expires_at = models.DateTimeField(null=True, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		ordering = ["-created_at"]
		indexes = [
			models.Index(fields=["status", "created_at"], name="verify_status_created_idx"),
		]
		constraints = [
			models.CheckConstraint(
				condition=(
					Q(user__isnull=False, organization__isnull=True)
					| Q(user__isnull=True, organization__isnull=False)
				),
				name="verification_has_one_subject",
			),
		]


class VerificationEvidence(models.Model):
	class ScanStatus(models.TextChoices):
		PENDING = "PENDING", "En attente"
		CLEAN = "CLEAN", "Sain"
		REJECTED = "REJECTED", "Rejeté"
		ERROR = "ERROR", "Erreur d’analyse"

	verification_case = models.ForeignKey(
		VerificationCase,
		on_delete=models.CASCADE,
		related_name="evidence",
	)
	storage_key = models.TextField(unique=True)
	evidence_type = models.CharField(max_length=50)
	original_filename = models.CharField(max_length=255)
	mime_type = models.CharField(max_length=120)
	size_bytes = models.PositiveBigIntegerField()
	sha256 = models.CharField(max_length=64, blank=True)
	uploaded_by = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.PROTECT,
		related_name="uploaded_verification_evidence",
	)
	uploaded_at = models.DateTimeField(auto_now_add=True)
	scanned_at = models.DateTimeField(null=True, blank=True)
	scan_status = models.CharField(
		max_length=16,
		choices=ScanStatus.choices,
		default=ScanStatus.PENDING,
	)

	class Meta:
		ordering = ["-uploaded_at"]
