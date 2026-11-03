import uuid

from django.conf import settings
from django.db import models


class UserProfile(models.Model):
	user = models.OneToOneField(
		settings.AUTH_USER_MODEL,
		on_delete=models.CASCADE,
		related_name="profile",
	)
	public_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
	display_name = models.CharField(max_length=160, blank=True)
	bio = models.TextField(blank=True)
	avatar_storage_key = models.TextField(blank=True)
	country_code = models.CharField(max_length=2, default="GN")
	region = models.CharField(max_length=120, blank=True)
	city = models.CharField(max_length=120, blank=True)
	phone_number = models.CharField(max_length=30, blank=True)
	phone_visible = models.BooleanField(default=False)
	profile_visible = models.BooleanField(default=True)
	institution = models.CharField(max_length=150, blank=True)
	study_field = models.CharField(max_length=150, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		return self.display_name or self.user.get_full_name() or self.user.email
