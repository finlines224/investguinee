from django.contrib import admin

from .models import Notification, NotificationBroadcast


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("title", "recipient", "kind", "created_at", "read_at")
    list_filter = ("kind", "read_at", "created_at")
    search_fields = ("title", "body", "recipient__email")
    readonly_fields = ("created_at", "read_at")


@admin.register(NotificationBroadcast)
class NotificationBroadcastAdmin(admin.ModelAdmin):
    list_display = ("title", "created_by", "created_at")
    search_fields = ("title", "body", "created_by__email")
    readonly_fields = ("created_at",)
