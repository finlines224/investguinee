from django.contrib import admin

from .models import EntrepreneurProject


@admin.register(EntrepreneurProject)
class EntrepreneurProjectAdmin(admin.ModelAdmin):
    list_display = ("title", "owner", "sector", "region", "status", "updated_at")
    list_filter = ("status", "sector", "region")
    search_fields = ("title", "owner__email")
    readonly_fields = ("created_at", "updated_at")
