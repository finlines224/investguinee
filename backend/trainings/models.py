from django.db import models


class TrainingResource(models.Model):
    class Category(models.TextChoices):
        ENTREPRENEURSHIP = "Entrepreneuriat", "Entrepreneuriat"
        FINANCE = "Finance", "Finance"
        SKILLS = "Compétences", "Compétences"

    title = models.CharField(max_length=180)
    description = models.TextField(max_length=5000)
    category = models.CharField(max_length=40, choices=Category.choices)
    format = models.CharField(max_length=80)
    level = models.CharField(max_length=60)
    url = models.URLField(max_length=500, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at", "-pk"]
        indexes = [
            models.Index(
                fields=["is_published", "category", "updated_at"],
                name="training_pub_cat_updated_idx",
            ),
        ]

    def __str__(self):
        return self.title
