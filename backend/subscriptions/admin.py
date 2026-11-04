from django.contrib import admin

from .models import SubscriptionRecord


@admin.register(SubscriptionRecord)
class SubscriptionRecordAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "plan_name",
        "status",
        "amount_paid",
        "currency",
        "started_at",
        "expires_at",
    )
    list_filter = ("status", "currency")
    search_fields = ("user__email", "plan_name")
    list_select_related = ("user",)
    readonly_fields = ("created_at", "updated_at")
