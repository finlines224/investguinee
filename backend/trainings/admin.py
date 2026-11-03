from django.contrib import admin

from .models import TrainingResource


@admin.register(TrainingResource)
class TrainingResourceAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "format", "level", "is_published", "updated_at")
    list_filter = ("is_published", "category", "level")
    search_fields = ("title", "description")
    readonly_fields = ("created_at", "updated_at")
